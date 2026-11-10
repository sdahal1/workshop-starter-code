// 1. LOAD: this starter reads one local JSON file. A future API can replace this fetch.
let products = [];
let selectedBrand = '';
let cart = []; // Cart contents live in memory and reset when this page reloads.
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const html = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const money = (cents) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
}).format(cents / 100);
const findProduct = (productId) => products.find((product) => product.productId === productId);

async function loadProducts() {
  $('#product-grid').setAttribute('aria-busy', 'true');
  $('#catalog-status').textContent = 'Loading the collection…';
  try {
    const response = await fetch('./products.json');
    if (!response.ok) throw new Error('The product file could not be loaded.');
    const loadedProducts = await response.json();
    if (!Array.isArray(loadedProducts)) throw new Error('products.json must contain an array of products.');
    products = loadedProducts;
    renderProducts();
  } catch (error) {
    $('#catalog-count').textContent = 'Catalog unavailable';
    $('#catalog-status').innerHTML = `
      <div class="state-box" role="alert">
        <h3>We couldn’t load the collection.</h3>
        <p>${html(error.message)} Open this folder through a local web server and check products.json.</p>
        <button class="button button-outline" type="button" data-retry>Try again</button>
      </div>`;
  } finally {
    $('#product-grid').setAttribute('aria-busy', 'false');
  }
}

// 2. FILTER: brand search runs in the browser, using an exact, case-insensitive match.
function renderProducts() {
  const visible = products.filter((product) => !selectedBrand
    || product.brand.toLowerCase() === selectedBrand.toLowerCase());
  $('#catalog-status').innerHTML = visible.length ? '' : `
    <div class="state-box"><h3>No bags found.</h3>
      <p>Try Northstar, Cityline, or Roam, or choose All brands.</p>
    </div>`;
  $('#catalog-count').textContent = `${visible.length} ${visible.length === 1 ? 'bag' : 'bags'} · ${selectedBrand || 'All brands'}`;
  $('#product-grid').innerHTML = visible.map((product) => `
    <article class="product-card">
      <button class="product-image-button" type="button" data-detail="${html(product.productId)}"
        aria-label="View ${html(product.name)} details">
        <img src="${html(product.image)}" alt="${html(product.name)}" loading="lazy" width="400" height="400">
        <span class="product-category">${html(product.category)}</span>
        <span class="quick-view" aria-hidden="true">↗</span>
      </button>
      <div class="card-meta">
        <span class="card-brand">${html(product.brand)}</span>
        <span class="rating"><span class="rating-star" aria-hidden="true">★</span>
          ${html(product.rating)} <span aria-label="${html(product.reviewCount)} reviews">(${html(product.reviewCount)})</span>
        </span>
      </div>
      <button class="product-title" type="button" data-detail="${html(product.productId)}">${html(product.name)}</button>
      <p class="card-description">${html(product.description)}</p>
      <div class="card-bottom">
        <span class="card-price">${money(product.priceCents)}</span>
        <button class="card-add" type="button" data-add="${html(product.productId)}"
          aria-label="Add ${html(product.name)} to bag" ${product.stock === 0 ? 'disabled' : ''}>
          ${product.stock === 0 ? 'Sold out' : 'Add to bag +'}
        </button>
      </div>
    </article>`).join('');
}

// 3. DETAILS: the selected product and its sample reviews come from the same array.
function showProduct(productId) {
  const product = findProduct(productId);
  if (!product) return;
  $('#product-detail').innerHTML = `
    <div class="detail-layout">
      <div class="detail-photo"><img src="${html(product.image)}" alt="${html(product.name)}"></div>
      <div class="detail-copy">
        <p class="detail-brand">${html(product.brand)} · ${html(product.category)}</p>
        <h2 id="detail-title">${html(product.name)}</h2>
        <p class="detail-rating"><span class="rating-star" aria-hidden="true">★</span>
          ${html(product.rating)} out of 5 · ${html(product.reviewCount)} reviews
        </p>
        <p class="detail-price">${money(product.priceCents)}</p>
        <p class="detail-description">${html(product.description)}</p>
        <ul class="feature-list">${product.features.map((feature) => `<li>${html(feature)}</li>`).join('')}</ul>
        <div class="detail-buy">
          <div class="field"><label for="detail-quantity">Quantity</label>
            <select id="detail-quantity">${Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}</select>
          </div>
          <button class="button button-dark" type="button" data-add-detail="${html(product.productId)}"
            ${product.stock === 0 ? 'disabled' : ''}>${product.stock === 0 ? 'Sold out' : 'Add to bag +'}</button>
        </div>
        <p class="stock-note">Sample stock: ${html(product.stock)} · Adding to your bag does not reserve stock.</p>
      </div>
    </div>
    <section class="reviews-section" aria-label="Customer reviews">
      <h3>A few words from the everyday.</h3>
      ${product.reviews.map((review) => `
        <article class="review">
          <div class="review-head"><strong>${html(review.author)}</strong>
            <span class="rating-star" aria-hidden="true">★</span><span>${html(review.rating)}/5</span>
          </div>
          <h4>${html(review.title)}</h4><p>${html(review.body)}</p>
        </article>`).join('')}
      <p class="review-disclaimer">Products, prices, ratings, and reviews are fictional workshop examples.</p>
    </section>`;
  $('#product-dialog').showModal();
}

// 4. CART: store product IDs and quantities, then calculate totals from the local data.
function addToCart(productId, quantity = 1) {
  const product = findProduct(productId);
  if (!product || product.stock === 0) return;
  const existing = cart.find((item) => item.productId === productId);
  const newQuantity = (existing?.quantity || 0) + quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || newQuantity > 10) {
    announce('You can add up to 10 of each bag in this demo.');
    return;
  }
  if (existing) existing.quantity = newQuantity;
  else cart.push({ productId, quantity });
  updateCartCount();
  announce(`${product.name} added to your bag.`);
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $('#cart-count').textContent = count;
  $('#cart-title-count').textContent = count ? `(${count})` : '';
  $('#open-cart').setAttribute('aria-label', `Open shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`);
}

function renderCart() {
  updateCartCount();
  if (!cart.length) {
    $('#cart-content').innerHTML = `
      <div class="empty-bag"><div class="empty-bag-symbol" aria-hidden="true">↗</div>
        <h3>Room for something good.</h3><p>Your bag is empty. Let’s find your next everyday companion.</p>
        <button class="button button-dark" type="button" data-continue>Explore the collection →</button>
      </div>`;
    return;
  }
  const total = cart.reduce((sum, item) => sum + findProduct(item.productId).priceCents * item.quantity, 0);
  $('#cart-content').innerHTML = cart.map((item) => {
    const product = findProduct(item.productId);
    return `
      <article class="cart-item">
        <img class="cart-item-image" src="${html(product.image)}" alt="${html(product.name)}">
        <div><p class="cart-item-brand">${html(product.brand)}</p>
          <div class="cart-item-name"><span>${html(product.name)}</span><span>${money(product.priceCents * item.quantity)}</span></div>
          <div class="cart-item-actions">
            <div class="quantity-control" aria-label="Quantity for ${html(product.name)}">
              <button type="button" data-quantity="${html(item.productId)}" data-delta="-1"
                aria-label="Decrease quantity for ${html(product.name)}" ${item.quantity === 1 ? 'disabled' : ''}>−</button>
              <output aria-label="Current quantity">${item.quantity}</output>
              <button type="button" data-quantity="${html(item.productId)}" data-delta="1"
                aria-label="Increase quantity for ${html(product.name)}" ${item.quantity === 10 ? 'disabled' : ''}>+</button>
            </div>
            <button class="remove-button" type="button" data-remove="${html(item.productId)}"
              aria-label="Remove ${html(product.name)} from bag">Remove</button>
          </div>
        </div>
      </article>`;
  }).join('') + `
    <div class="cart-total"><span>Item total</span><span>${money(total)}</span></div>
    <p class="cart-explanation">Your bag is kept in this browser tab and clears when you refresh. Checkout is not connected yet.</p>
    <button class="button button-dark checkout-button" id="checkout" type="button">Continue to checkout →</button>
    <div id="checkout-message" role="status"></div>`;
}

// 5. CHECKOUT: this is the future backend connection point. Nothing is submitted here.
function checkout() {
  $('#checkout-message').innerHTML = `
    <div class="cart-feedback"><strong>Checkout needs a backend.</strong><br>
      To place an order, this page needs a backend that checks prices and stock and saves the order.
      Nothing was submitted, and no payment was collected.
    </div>`;
}

function announce(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}

$('#brand-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const typed = $('#brand-select').value.trim();
  selectedBrand = products.find((product) => product.brand.toLowerCase() === typed.toLowerCase())?.brand || typed;
  $('#brand-select').value = selectedBrand;
  renderProducts();
});
$('#all-brands').addEventListener('click', () => {
  selectedBrand = '';
  $('#brand-select').value = '';
  renderProducts();
});
$('#open-cart').addEventListener('click', () => {
  renderCart();
  $('#cart-dialog').showModal();
});

// One click listener also handles buttons created by the rendering functions above.
// dataset reads the matching data-* attributes in the HTML templates.
document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.close) $(`#${button.dataset.close}`).close();
  if (button.dataset.detail) showProduct(button.dataset.detail);
  if (button.dataset.add) addToCart(button.dataset.add);
  if (button.dataset.addDetail) addToCart(button.dataset.addDetail, Number($('#detail-quantity').value));
  if (button.dataset.quantity) {
    const item = cart.find((entry) => entry.productId === button.dataset.quantity);
    const quantity = item.quantity + Number(button.dataset.delta);
    if (quantity >= 1 && quantity <= 10) item.quantity = quantity;
    renderCart();
  }
  if (button.dataset.remove) {
    cart = cart.filter((item) => item.productId !== button.dataset.remove);
    renderCart();
    announce('Item removed from your bag.');
  }
  if (button.hasAttribute('data-continue')) {
    $('#cart-dialog').close();
    $('#shop').scrollIntoView({ behavior: 'smooth' });
  }
  if (button.hasAttribute('data-retry')) loadProducts();
  if (button.id === 'checkout') checkout();
});

// Native dialogs support Escape and keyboard focus. A click outside closes them too.
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}

loadProducts();
