document.addEventListener('DOMContentLoaded', () => {
    // 1. Get the product ID from the URL
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');

    if (!itemId) {
        // Handle case where no ID is provided
        document.querySelector('.item-detail-container').innerHTML = '<h1>Item not found!</h1>';
        return;
    }

    // 2. Fetch all products from the JSON file
    fetch('../products.json')
        .then(response => response.json())
        .then(data => {
            // 3. Find the specific item by its ID
            const item = data.find(p => p.id == itemId);

            if (!item) {
                // Handle case where item with given ID is not found
                document.querySelector('.item-detail-container').innerHTML = '<h1>Item not found!</h1>';
                return;
            }

            // 4. Populate the page with the item's data
            displayItemDetails(item);

            // 5. Display recommended items
            displayRecommendedItems(data, item.category, item.id);
        })
        .catch(error => {
            console.error('Error fetching product data:', error);
            document.querySelector('.item-detail-container').innerHTML = '<h1>Error loading item. Please try again.</h1>';
        });
});

function displayItemDetails(item) {
    document.getElementById('item-title').textContent = item.name;
    document.getElementById('item-price').textContent = `₹${item.price}`;
    document.getElementById('item-description').textContent = item.description;
    document.getElementById('item-image').src = `../${item.image}`; // Assuming image paths are relative to root
    document.getElementById('item-image').alt = item.name;
    
    // You can also set the document title
    document.title = `${item.name} - Foodie`;
}

function displayRecommendedItems(allItems, currentCategory, currentId) {
    const recommendedContainer = document.getElementById('recommended-items');
    
    // Filter items from the same category, excluding the current one
    const recommended = allItems.filter(item => item.category === currentCategory && item.id != currentId);

    // Get up to 3 random items from the filtered list
    const itemsToShow = recommended.sort(() => 0.5 - Math.random()).slice(0, 3);

    itemsToShow.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('recommended-item');
        itemElement.innerHTML = `
            <a href="item-detail.html?id=${item.id}">
                <img src="../${item.image}" alt="${item.name}">
                <p>${item.name}</p>
                <strong>₹${item.price}</strong>
            </a>
        `;
        recommendedContainer.appendChild(itemElement);
    });
}