document.addEventListener('DOMContentLoaded', () => {
  // Global Store Data State
  let storeData = null;
  let activeCategory = 'all';
  let heroSlideIndex = 0;
  let heroInterval = null;
  const adminPasscode = 'zanish123'; // Simple, customizable passcode for demonstration
  
  // DOM Elements
  const loadingScreen = document.getElementById('loading-screen');
  const productsGrid = document.getElementById('products-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  
  // Admin DOM Elements
  const adminToggleBtn = document.getElementById('admin-toggle-btn');
  const adminModal = document.getElementById('admin-modal');
  const adminOverlay = document.getElementById('admin-modal-overlay');
  const adminCloseBtn = document.getElementById('admin-close-btn');
  const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
  const adminTabPanes = document.querySelectorAll('.admin-tab-pane');
  
  // Forms & Inputs
  const formStoreInfo = document.getElementById('admin-store-info-form');
  const formProduct = document.getElementById('admin-product-form');
  const adminProductList = document.getElementById('admin-products-list');
  const btnExport = document.getElementById('admin-export-btn');
  const btnReset = document.getElementById('admin-reset-btn');
  const productFormTitle = document.getElementById('product-form-title');
  const productIdInput = document.getElementById('admin-p-id');
  const productSubmitBtn = document.getElementById('product-submit-btn');

  // Initialize App
  init();

  async function init() {
    try {
      // 1. Fetch initial configuration
      const response = await fetch('./products.json');
      const defaultData = await response.json();
      
      // 2. Load from localStorage if present, otherwise load default
      const savedData = localStorage.getItem('zanish_store_data');
      if (savedData) {
        storeData = JSON.parse(savedData);
        console.log('Loaded custom store configuration from localStorage');
      } else {
        storeData = defaultData;
        localStorage.setItem('zanish_store_data', JSON.stringify(storeData));
        console.log('Initialized localStorage with default store configuration');
      }

      // 3. Render page elements
      renderStoreInfo();
      renderProducts();
      setupHeroSlider();
      setupAdminDashboard();
      
      // 4. Hide Loading Screen
      setTimeout(() => {
        loadingScreen.classList.add('fade-out');
      }, 1500);

    } catch (error) {
      console.error('Error initializing Zanish Clothing store:', error);
      // Fallback display if fetch fails (e.g. running directly from file:// protocol without local server)
      alert('Welcome to Zanish Clothing! For the best experience (including config loading and product images), please run this project using a local web server (e.g. Live Server).');
      
      // Load empty state so page doesn't break
      storeData = {
        storeInfo: {
          name: "Zanish Clothing",
          contactWhatsApp: "+919539699044",
          contactDisplay: "+91 95396 99044",
          instagram: "zanishclothing_",
          logoUrl: "",
          address: { street: "KK Road, Perla", city: "Kasaragod", state: "Kerala", pincode: "671552", country: "India" },
          heroQuote: "Curating premium fashion for your everyday elegance.",
          heroSubquote: "A perfect blend of modern style and timeless comfort."
        },
        heroBackgrounds: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"],
        products: []
      };
      renderStoreInfo();
      renderProducts();
      setupHeroSlider();
      setupAdminDashboard();
      loadingScreen.classList.add('fade-out');
    }

    setupEventListeners();
  }

  // --- UI RENDER FUNCTIONS ---
  function renderStoreInfo() {
    if (!storeData || !storeData.storeInfo) return;
    const info = storeData.storeInfo;

    // Page Title
    document.title = `${info.name} | Modern Premium Fashion`;

    // Render Logos
    const logoContainers = document.querySelectorAll('.logo-container');
    logoContainers.forEach(container => {
      if (info.logoUrl) {
        container.innerHTML = `<img src="${info.logoUrl}" alt="${info.name} Logo" class="logo-img">`;
      } else {
        container.innerHTML = `
          <div class="logo-placeholder">Z</div>
          <span class="logo-text">${info.name.split(' ')[0]} <span>${info.name.split(' ')[1] || ''}</span></span>
        `;
      }
    });

    // Loading Logo Placeholder
    const loaderLogoWrapper = document.getElementById('loader-logo-wrapper');
    if (loaderLogoWrapper) {
      if (info.logoUrl) {
        loaderLogoWrapper.innerHTML = `<img src="${info.logoUrl}" alt="Loading ${info.name}" class="loader-logo">`;
      } else {
        loaderLogoWrapper.innerHTML = `<div class="loader-logo-placeholder">Z</div>`;
      }
    }

    // Hero Text
    const heroTitle = document.querySelector('.hero-title');
    const heroDesc = document.querySelector('.hero-description');
    if (heroTitle) heroTitle.innerHTML = `Zanish <span>Clothing</span>`;
    if (heroDesc) heroDesc.textContent = info.heroQuote;

    // Contact details throughout the page
    const whatsappLinks = document.querySelectorAll('.whatsapp-link');
    whatsappLinks.forEach(link => {
      link.href = `https://wa.me/${info.contactWhatsApp.replace(/[^0-9]/g, '')}`;
      link.textContent = info.contactDisplay;
    });

    const instagramLinks = document.querySelectorAll('.instagram-link');
    instagramLinks.forEach(link => {
      link.href = `https://instagram.com/${info.instagram}`;
      link.textContent = `@${info.instagram}`;
    });

    // Full Address display
    const addressElements = document.querySelectorAll('.address-display');
    const addr = info.address;
    const fullAddrStr = `${addr.street}, ${addr.city}, ${addr.state}, ${addr.country} - ${addr.pincode}`;
    addressElements.forEach(el => {
      el.innerHTML = `
        <strong>${info.name}</strong><br>
        ${addr.street}<br>
        ${addr.city}, ${addr.state}<br>
        India - ${addr.pincode}
      `;
    });
  }

  function renderProducts() {
    if (!storeData || !storeData.products) return;
    productsGrid.innerHTML = '';

    const filtered = storeData.products.filter(p => {
      if (activeCategory === 'all') return true;
      return p.category.toLowerCase() === activeCategory.toLowerCase();
    });

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
          <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; color: var(--accent-medium);"></i>
          <p>No products found in this category. Admin changes will appear here.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.setAttribute('data-category', product.category);

      // WhatsApp standardized format generator
      // "i need this product is that available now.can you give describe about it." -> Standardized premium message
      const rawMessage = `Hello Zanish Clothing! I am interested in purchasing this product:\n\n*Product:* ${product.name}\n*Price:* ₹${product.price}\n*Category:* ${product.category.toUpperCase()}\n\nIs this available right now? Could you please share more details or sizes available? Thank you!`;
      const encodedMsg = encodeURIComponent(rawMessage);
      const whatsappUrl = `https://wa.me/${storeData.storeInfo.contactWhatsApp.replace(/[^0-9]/g, '')}?text=${encodedMsg}`;

      // Default picture fallback if blank
      const imgUrl = product.imageUrl || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80';

      card.innerHTML = `
        <div class="product-img-wrapper">
          <img src="${imgUrl}" alt="${product.name}" class="product-img" loading="lazy">
          <span class="product-category-tag">${product.category}</span>
        </div>
        <div class="product-info">
          <h4 class="product-title">${product.name}</h4>
          <p class="product-desc">${product.description || 'Premium wardrobe essential curated with care.'}</p>
          <div class="product-footer">
            <span class="product-price">₹${product.price}</span>
            <a href="${whatsappUrl}" target="_blank" class="btn-whatsapp-order">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 2px;">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.977h.004c4.368 0 7.926-3.559 7.93-7.93a7.897 7.897 0 0 0-2.33-5.619zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.69-4.98c-.203-.101-1.2-.593-1.383-.66-.182-.066-.315-.099-.445.099-.133.197-.513.662-.63.797-.114.133-.232.148-.435.05-.201-.1-.849-.313-1.616-.997-.597-.533-1.002-1.192-1.119-1.397-.118-.203-.013-.31.088-.41.09-.09.201-.232.301-.35.1-.117.135-.198.2-.33.065-.133.032-.25-.015-.35-.047-.1-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.2-.491 1.37-1.03.171-.539.171-.998.121-1.096-.05-.099-.182-.132-.38-.232z"/>
              </svg>
              Order via WA
            </a>
          </div>
        </div>
      `;
      productsGrid.appendChild(card);
    });
  }

  // --- HERO BACKGROUND ROTATOR ---
  function setupHeroSlider() {
    const sliderContainer = document.getElementById('hero-bg-slider');
    if (!sliderContainer || !storeData || !storeData.heroBackgrounds) return;

    sliderContainer.innerHTML = '';
    
    // Create slides
    storeData.heroBackgrounds.forEach((bgUrl, index) => {
      const slide = document.createElement('div');
      slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
      slide.style.backgroundImage = `url('${bgUrl}')`;
      sliderContainer.appendChild(slide);
    });

    // Auto rotate slides
    if (heroInterval) clearInterval(heroInterval);
    
    if (storeData.heroBackgrounds.length > 1) {
      heroInterval = setInterval(() => {
        const slides = document.querySelectorAll('.hero-slide');
        if (slides.length === 0) return;
        
        slides[heroSlideIndex].classList.remove('active');
        heroSlideIndex = (heroSlideIndex + 1) % slides.length;
        slides[heroSlideIndex].classList.add('active');
      }, 5000); // Rotate every 5 seconds
    }
  }

  // --- MOBILE NAVIGATION ---
  function toggleMobileMenu() {
    navLinks.classList.toggle('mobile-open');
    const isOpen = navLinks.classList.contains('mobile-open');
    mobileMenuBtn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  }


  // --- ADMIN DASHBOARD PANELS & TABS ---
  function setupAdminDashboard() {
    // Populate form fields
    if (!storeData) return;
    const info = storeData.storeInfo;
    
    document.getElementById('admin-store-name').value = info.name;
    document.getElementById('admin-store-whatsapp').value = info.contactWhatsApp;
    document.getElementById('admin-store-display-num').value = info.contactDisplay;
    document.getElementById('admin-store-instagram').value = info.instagram;
    document.getElementById('admin-store-logo').value = info.logoUrl;
    document.getElementById('admin-hero-quote').value = info.heroQuote;
    document.getElementById('admin-hero-subquote').value = info.heroSubquote;
    
    // Address fields
    document.getElementById('admin-addr-street').value = info.address.street;
    document.getElementById('admin-addr-city').value = info.address.city;
    document.getElementById('admin-addr-state').value = info.address.state;
    document.getElementById('admin-addr-pincode').value = info.address.pincode;

    // Background fields
    document.getElementById('admin-bg-hero1').value = storeData.heroBackgrounds[0] || '';
    document.getElementById('admin-bg-hero2').value = storeData.heroBackgrounds[1] || '';

    // Render products list inside admin drawer
    renderAdminProductsList();
  }

  function renderAdminProductsList() {
    adminProductList.innerHTML = '';
    
    if (!storeData || !storeData.products) return;

    storeData.products.forEach(p => {
      const row = document.createElement('div');
      row.className = 'admin-item-row';
      row.innerHTML = `
        <div class="admin-item-meta">
          <span class="admin-item-name">${p.name}</span>
          <span class="admin-item-cat">${p.category} | ₹${p.price}</span>
        </div>
        <div class="admin-actions-cell">
          <button class="admin-btn-icon edit" data-id="${p.id}" title="Edit Product">
            <i class="fas fa-edit"></i>
          </button>
          <button class="admin-btn-icon delete" data-id="${p.id}" title="Delete Product">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
      adminProductList.appendChild(row);
    });

    // Add list click events for edit & delete
    adminProductList.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        loadProductToForm(id);
      });
    });

    adminProductList.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this product?')) {
          deleteProduct(id);
        }
      });
    });
  }

  function loadProductToForm(id) {
    const product = storeData.products.find(p => p.id === id);
    if (!product) return;

    productIdInput.value = product.id;
    document.getElementById('admin-p-name').value = product.name;
    document.getElementById('admin-p-category').value = product.category;
    document.getElementById('admin-p-price').value = product.price;
    document.getElementById('admin-p-image').value = product.imageUrl || '';
    document.getElementById('admin-p-desc').value = product.description || '';

    productFormTitle.textContent = 'Edit Product Details';
    productSubmitBtn.textContent = 'Update Product';
    
    // Switch to products tab if not active
    switchAdminTab('products');
  }

  function resetProductForm() {
    productIdInput.value = '';
    formProduct.reset();
    productFormTitle.textContent = 'Add New Product';
    productSubmitBtn.textContent = 'Add Product to Store';
  }

  function deleteProduct(id) {
    storeData.products = storeData.products.filter(p => p.id !== id);
    saveStoreData();
    renderProducts();
    renderAdminProductsList();
    resetProductForm();
  }

  // --- DATA STORAGE & STATE PERSISTENCE ---
  function saveStoreData() {
    localStorage.setItem('zanish_store_data', JSON.stringify(storeData));
  }

  function openAdminPanel() {
    const entered = prompt('Enter Admin Passcode to configure the website:', '');
    if (entered === null) return; // User cancelled
    
    if (entered === adminPasscode) {
      adminModal.classList.add('open');
      adminOverlay.classList.add('open');
      document.body.style.overflow = 'hidden'; // Stop page scrolling
    } else {
      alert('Incorrect passcode. Access Denied.');
    }
  }

  function closeAdminPanel() {
    adminModal.classList.remove('open');
    adminOverlay.classList.remove('open');
    document.body.style.overflow = 'auto'; // Re-enable scrolling
    resetProductForm();
  }

  function switchAdminTab(targetTabId) {
    adminTabBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === targetTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    adminTabPanes.forEach(pane => {
      if (pane.id === `tab-${targetTabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  // --- EVENT LISTENERS SETUP ---
  function setupEventListeners() {
    // 1. Category Filtering
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        activeCategory = e.target.getAttribute('data-category');
        renderProducts();
      });
    });

    // 2. Mobile Menu
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    
    // Close mobile menu on clicking nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('mobile-open')) {
          toggleMobileMenu();
        }
      });
    });

    // 3. Admin Panel Open/Close
    adminToggleBtn.addEventListener('click', openAdminPanel);
    adminCloseBtn.addEventListener('click', closeAdminPanel);
    adminOverlay.addEventListener('click', closeAdminPanel);

    // 4. Admin Tab Switching
    adminTabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        switchAdminTab(e.target.getAttribute('data-tab'));
      });
    });

    // 5. Store Info Form Submit
    formStoreInfo.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Update storeInfo text
      storeData.storeInfo.name = document.getElementById('admin-store-name').value;
      storeData.storeInfo.contactWhatsApp = document.getElementById('admin-store-whatsapp').value;
      storeData.storeInfo.contactDisplay = document.getElementById('admin-store-display-num').value;
      storeData.storeInfo.instagram = document.getElementById('admin-store-instagram').value;
      storeData.storeInfo.logoUrl = document.getElementById('admin-store-logo').value;
      storeData.storeInfo.heroQuote = document.getElementById('admin-hero-quote').value;
      storeData.storeInfo.heroSubquote = document.getElementById('admin-hero-subquote').value;

      // Update Address
      storeData.storeInfo.address.street = document.getElementById('admin-addr-street').value;
      storeData.storeInfo.address.city = document.getElementById('admin-addr-city').value;
      storeData.storeInfo.address.state = document.getElementById('admin-addr-state').value;
      storeData.storeInfo.address.pincode = document.getElementById('admin-addr-pincode').value;

      // Update Hero backgrounds
      storeData.heroBackgrounds = [
        document.getElementById('admin-bg-hero1').value,
        document.getElementById('admin-bg-hero2').value
      ].filter(url => url.trim() !== ''); // Keep valid urls

      saveStoreData();
      renderStoreInfo();
      setupHeroSlider();
      alert('Store details and background settings saved successfully in your browser!');
    });

    // 6. Product Add/Edit Form Submit
    formProduct.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const id = productIdInput.value;
      const name = document.getElementById('admin-p-name').value;
      const category = document.getElementById('admin-p-category').value;
      const price = parseFloat(document.getElementById('admin-p-price').value);
      const imageUrl = document.getElementById('admin-p-image').value;
      const description = document.getElementById('admin-p-desc').value;

      if (id) {
        // Edit mode
        const index = storeData.products.findIndex(p => p.id === id);
        if (index !== -1) {
          storeData.products[index] = { id, name, category, price, imageUrl, description };
          alert('Product details updated successfully!');
        }
      } else {
        // Create mode
        const newId = `${category}-${Date.now()}`;
        storeData.products.push({ id: newId, name, category, price, imageUrl, description });
        alert('New product added successfully!');
      }

      saveStoreData();
      renderProducts();
      renderAdminProductsList();
      resetProductForm();
    });

    // Cancel edit product
    document.getElementById('admin-p-cancel').addEventListener('click', resetProductForm);

    // 7. Download JSON Export Configuration
    btnExport.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storeData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "products.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      alert('Downloaded configuration file! To apply this permanently across all users, upload this file to your hosting server to replace the existing "products.json".');
    });

    // 8. Reset to Defaults
    btnReset.addEventListener('click', () => {
      if (confirm('Are you sure you want to discard all your browser edits and reset to the original default store configuration?')) {
        localStorage.removeItem('zanish_store_data');
        location.reload();
      }
    });

    // 9. Scroll Navigation active highlight
    window.addEventListener('scroll', () => {
      let currentSection = '';
      const sections = document.querySelectorAll('section, header, div[id]');
      const scrollPosition = window.scrollY + 100;

      sections.forEach(sec => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');
        if (id && scrollPosition >= top && scrollPosition < (top + height)) {
          currentSection = id;
        }
      });

      const navItems = navLinks.querySelectorAll('a');
      navItems.forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href') === `#${currentSection}`) {
          a.classList.add('active');
        }
      });
    });
  }
});
