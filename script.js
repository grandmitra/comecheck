document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const groceryForm = document.getElementById('groceryForm');
    const groceryItemsContainer = document.getElementById('groceryItems');
    const addItemBtn = document.getElementById('addItemBtn');
    const itemModal = document.getElementById('itemModal');
    const closeBtn = document.querySelector('.close-btn');
    const searchInput = document.getElementById('searchInput');
    const storeFilter = document.getElementById('storeFilter');
    const sortBy = document.getElementById('sortBy');
    const themeToggle = document.getElementById('themeToggle');
    
    // Stats elements
    const totalItemsEl = document.getElementById('totalItems');
    const totalCostEl = document.getElementById('totalCost');
    const remainingItemsEl = document.getElementById('remainingItems');
    
    // Grocery items array
    let groceryItems = JSON.parse(localStorage.getItem('groceryItems')) || [];
    
    // Initialize the app
    function init() {
        renderGroceryItems();
        updateStats();
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light-mode';
        document.body.className = savedTheme;
        themeToggle.checked = savedTheme === 'dark-mode';
    }
    
    // Render grocery items to the DOM
    function renderGroceryItems(filteredItems = null) {
        const itemsToRender = filteredItems || groceryItems;
        
        if (itemsToRender.length === 0) {
            groceryItemsContainer.innerHTML = '<div class="empty-state">No items found. Add some items to get started!</div>';
            return;
        }
        
        groceryItemsContainer.innerHTML = '';
        
        itemsToRender.forEach(item => {
            const groceryItem = document.createElement('div');
            groceryItem.className = `grocery-item ${item.purchased ? 'purchased' : ''}`;
            groceryItem.dataset.id = item.id;
            
            groceryItem.innerHTML = `
                <div class="item-name">
                    <input type="checkbox" class="item-checkbox" ${item.purchased ? 'checked' : ''}>
                    <span>${item.name}</span>
                    ${item.notes ? '<i class="fas fa-sticky-note" title="' + item.notes + '"></i>' : ''}
                </div>
                <div class="item-price">${item.price.toFixed(0)}</div>
                <div class="item-store">
                    <span class="store-icon">${item.store.charAt(0)}</span>
                    <span>${item.store}</span>
                </div>
                <div class="item-date">${formatDate(item.date)}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            groceryItemsContainer.appendChild(groceryItem);
        });
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.item-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const itemId = this.closest('.grocery-item').dataset.id;
                togglePurchasedStatus(itemId, this.checked);
            });
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.closest('.grocery-item').dataset.id;
                editItem(itemId);
            });
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.closest('.grocery-item').dataset.id;
                deleteItem(itemId);
            });
        });
    }
    
    // Format date for display
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    // Add a new grocery item
    function addItem(e) {
        e.preventDefault();
        
        const id = Date.now().toString();
        const name = document.getElementById('itemName').value;
        const price = parseFloat(document.getElementById('itemPrice').value);
        const store = document.getElementById('itemStore').value;
        const notes = document.getElementById('itemNotes').value;
        const purchased = document.getElementById('itemPurchased').checked;
        const date = new Date().toISOString();
        
        const newItem = {
            id,
            name,
            price,
            store,
            notes,
            purchased,
            date
        };
        
        groceryItems.unshift(newItem);
        saveToLocalStorage();
        renderGroceryItems();
        updateStats();
        closeModal();
    }
    
    // Edit an existing item
    function editItem(itemId) {
        const item = groceryItems.find(item => item.id === itemId);
        if (!item) return;
        
        document.getElementById('modalTitle').textContent = 'Edit Grocery Item';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemStore').value = item.store;
        document.getElementById('itemNotes').value = item.notes || '';
        document.getElementById('itemPurchased').checked = item.purchased;
        
        openModal();
    }
    
    // Update an item
    function updateItem(e) {
        e.preventDefault();
        
        const id = document.getElementById('itemId').value;
        const name = document.getElementById('itemName').value;
        const price = parseFloat(document.getElementById('itemPrice').value);
        const store = document.getElementById('itemStore').value;
        const notes = document.getElementById('itemNotes').value;
        const purchased = document.getElementById('itemPurchased').checked;
        
        const itemIndex = groceryItems.findIndex(item => item.id === id);
        
        if (itemIndex !== -1) {
            groceryItems[itemIndex] = {
                ...groceryItems[itemIndex],
                name,
                price,
                store,
                notes,
                purchased
            };
            
            saveToLocalStorage();
            renderGroceryItems();
            updateStats();
            closeModal();
        }
    }
    
    // Delete an item
    function deleteItem(itemId) {
        if (confirm('Are you sure you want to delete this item?')) {
            groceryItems = groceryItems.filter(item => item.id !== itemId);
            saveToLocalStorage();
            renderGroceryItems();
            updateStats();
        }
    }
    
    // Toggle purchased status
    function togglePurchasedStatus(itemId, isPurchased) {
        const item = groceryItems.find(item => item.id === itemId);
        if (item) {
            item.purchased = isPurchased;
            saveToLocalStorage();
            updateStats();
            
            // Re-render to update the visual state
            const groceryItemElement = document.querySelector(`.grocery-item[data-id="${itemId}"]`);
            if (groceryItemElement) {
                if (isPurchased) {
                    groceryItemElement.classList.add('purchased');
                } else {
                    groceryItemElement.classList.remove('purchased');
                }
            }
        }
    }
    
    // Filter and sort items
    function filterAndSortItems() {
        let filteredItems = [...groceryItems];
        
        // Apply search filter
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredItems = filteredItems.filter(item => 
                item.name.toLowerCase().includes(searchTerm) || 
                (item.notes && item.notes.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply store filter
        const selectedStore = storeFilter.value;
        if (selectedStore !== 'all') {
            filteredItems = filteredItems.filter(item => item.store === selectedStore);
        }
        
        // Apply sorting
        const sortValue = sortBy.value;
        switch (sortValue) {
            case 'name':
                filteredItems.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price-low':
                filteredItems.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredItems.sort((a, b) => b.price - a.price);
                break;
            case 'store':
                filteredItems.sort((a, b) => a.store.localeCompare(b.store));
                break;
            case 'date':
                filteredItems.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            default:
                // Default sort by date (newest first)
                filteredItems.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        
        renderGroceryItems(filteredItems);
    }
    
    // Update statistics
    function updateStats() {
        const totalItems = groceryItems.length;
        const totalCost = groceryItems.reduce((sum, item) => sum + item.price, 0);
        const remainingItems = groceryItems.filter(item => !item.purchased).length;
        
        totalItemsEl.textContent = totalItems;
        totalCostEl.textContent = `${totalCost.toFixed(0)}`;
        remainingItemsEl.textContent = remainingItems;
    }
    
    // Save to local storage
    function saveToLocalStorage() {
        localStorage.setItem('groceryItems', JSON.stringify(groceryItems));
    }
    
    // Modal functions
    function openModal() {
        itemModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal() {
        itemModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        groceryForm.reset();
        document.getElementById('itemId').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Item';
    }
    
    // Toggle theme
    function toggleTheme() {
        if (themeToggle.checked) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark-mode');
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light-mode');
        }
    }
    
    // Event Listeners
    addItemBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        if (e.target === itemModal) {
            closeModal();
        }
    });
    
    groceryForm.addEventListener('submit', function(e) {
        const itemId = document.getElementById('itemId').value;
        if (itemId) {
            updateItem(e);
        } else {
            addItem(e);
        }
    });
    
    searchInput.addEventListener('input', filterAndSortItems);
    storeFilter.addEventListener('change', filterAndSortItems);
    sortBy.addEventListener('change', filterAndSortItems);
    themeToggle.addEventListener('change', toggleTheme);
    
    // Initialize the app
    init();
});
