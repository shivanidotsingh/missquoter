document.addEventListener('DOMContentLoaded', () => {
    const quotesContainer = document.querySelector('.quotes-container');
    const quotes = Array.from(document.querySelectorAll('.quote'));
    const viewAllToggle = document.getElementById('viewAllToggle');

    let isDragging = false;
    let currentDraggable = null;
    let xOffset = 0;
    let yOffset = 0;
    let maxZIndex = 1; // To manage z-index for dragged elements
    let isGridView = false; 

    
    function stackCards() {
    isGridView = false;
    quotesContainer.style.height = '100vh'; // Reset container height for full viewport
    quotesContainer.style.overflowY = 'hidden'; // Hide overflow for stacked view
    viewAllToggle.textContent = 'distribute 🪄'; // Set toggle text for stacked view

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Pick a random index that will become the topmost card
    const frontIndex = Math.floor(Math.random() * quotes.length);

    quotes.forEach((quote, index) => {
        // Reset styles
        quote.style.boxShadow = 'none';
        quote.style.cursor = 'grab';

        // Base z-index for all
        let z = 1;
        // If this is the chosen “front” card, bump it above others
        if (index === frontIndex) {
            z = 999; // or any number > 1
        }
        quote.style.zIndex = z;

        // Position in center with slight random tilt
        const randomRotation = Math.random() * 6 - 3; // -3deg to 3deg
        quote.style.left = `${centerX}px`;
        quote.style.top = `${centerY}px`;
        quote.style.transform = `translate(-50%, -50%) rotate(${randomRotation}deg)`;
    });

    // Keep drag z-index logic consistent
    maxZIndex = 999;
}


    // Function to arrange cards in a masonry-like grid
    function arrangeInGrid() {
        isGridView = true;
        quotesContainer.style.overflowY = 'auto'; // Enable scrolling for grid view
        viewAllToggle.textContent = 'gather'; // Set toggle text for grid view

        const containerWidth = quotesContainer.offsetWidth;
        const gap = 20; 
        const quoteWidth = Math.ceil(quotes[0].getBoundingClientRect().width);


        // Calculate number of columns based on available width
        let numColumns = Math.floor((containerWidth + gap) / (quoteWidth + gap));
        if (numColumns < 1) numColumns = 1;

        // Calculate the actual width the grid will occupy and its starting X position to center it
        const actualGridWidth = (numColumns * quoteWidth) + ((numColumns - 1) * gap);
        const gridStartLeft = Math.max(0, Math.floor((containerWidth - actualGridWidth) / 2));

        // Initialize an array to track the current height of each column
        // Start with a top margin of 30px for all columns
        let columnHeights = Array(numColumns).fill(30); 

        quotes.forEach((quote, index) => {
            quote.style.boxShadow = 'none'; // Remove shadow
            quote.style.cursor = 'default';
            quote.style.zIndex = 1; // Reset z-index for grid view

            // Find the column with the minimum height to place the next quote
            let minHeight = Infinity;
            let targetColumnIndex = 0;
            for (let i = 0; i < numColumns; i++) {
                if (columnHeights[i] < minHeight) {
                    minHeight = columnHeights[i];
                    targetColumnIndex = i;
                }
            }

            // Calculate the x and y position for the current quote
            const x = gridStartLeft + (targetColumnIndex * (quoteWidth + gap));
            const y = columnHeights[targetColumnIndex];

            quote.style.left = `${x}px`;
            quote.style.top = `${y}px`;
            
            // Apply the specific grid rotation (from original design)
            const n = index + 1; // CSS nth-child is 1-indexed
            let rotation = 0;
            if (n % 4 === 1) rotation = -1;
            else if (n % 4 === 2) rotation = 1.2;
            else if (n % 4 === 3) rotation = -0.7;
            else if (n % 4 === 0) rotation = 0.8;
            quote.style.transform = `rotate(${rotation}deg)`;

            // Update the height of the column where the quote was placed
            // Use offsetHeight to get the full rendered height of the quote
            columnHeights[targetColumnIndex] += quote.offsetHeight + gap;
        });

        // Set the quotesContainer height to accommodate the tallest column in the grid
        const maxContentHeight = Math.max(...columnHeights);
        quotesContainer.style.height = `${maxContentHeight + 30}px`; // Add some bottom padding
    }

    // Toggle between stacked and grid view
    viewAllToggle.addEventListener('click', () => {
        if (isGridView) {
            stackCards();
        } else {
            arrangeInGrid();
        }
    });

    // Drag event handlers
    function dragStart(e) {
        if (isGridView) { // Prevent dragging in grid view
            return;
        }
        currentDraggable = e.target.closest('.quote');
        if (!currentDraggable) return;

        isDragging = true;
        currentDraggable.classList.add('dragging');
        maxZIndex++;
        currentDraggable.style.zIndex = maxZIndex; // Bring dragged element to front

        let clientX, clientY;
        if (e.type === "touchstart") {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Calculate offset from the top-left corner of the element to the mouse/touch point
        const rect = currentDraggable.getBoundingClientRect();
        xOffset = clientX - rect.left;
        yOffset = clientY - rect.top;

        // Remove the translate and rotate transform when dragging starts
        currentDraggable.style.transform = 'none';
    }

    function dragEnd() {
        isDragging = false;
        if (currentDraggable) {
            currentDraggable.classList.remove('dragging');
            currentDraggable = null;
        }
    }

    function drag(e) {
        if (!isDragging || !currentDraggable) return;

        e.preventDefault(); // Prevent default touch actions like scrolling

        let clientX, clientY;
        if (e.type === "touchmove") {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Calculate new position relative to the quotesContainer
        const containerRect = quotesContainer.getBoundingClientRect();
        let newX = clientX - xOffset - containerRect.left;
        let newY = clientY - yOffset - containerRect.top;

        // Constrain movement within the quotesContainer boundaries
        newX = Math.max(0, Math.min(newX, containerRect.width - currentDraggable.offsetWidth));
        newY = Math.max(0, Math.min(newY, containerRect.height - currentDraggable.offsetHeight));

        currentDraggable.style.left = `${newX}px`;
        currentDraggable.style.top = `${newY}px`;
    }

    // Add event listeners for drag and drop
    quotes.forEach(quote => {
        quote.addEventListener('mousedown', dragStart);
        quote.addEventListener('touchstart', dragStart, { passive: false });
    });

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });

    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
    document.addEventListener('mouseleave', dragEnd);

    // Initial setup: stack cards on page load
    stackCards();

    // Recalculate positions if window is resized
    window.addEventListener('resize', () => {
        if (isGridView) {
            arrangeInGrid();
        } else {
            stackCards();
        }
    });
});
