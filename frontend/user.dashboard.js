// Path: C:\xampp\htdocs\hometownbank\frontend\user.dashboard.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Dynamic User Name Display ---
    const greetingElement = document.querySelector('.greeting h1');
    if (greetingElement) {
        // Get user's first name from the data attribute set by PHP
        const userFirstName = greetingElement.dataset.userFirstName || "User"; // Fallback to "User"
        greetingElement.textContent = `Hi, ${userFirstName}`;
    }

    // --- Logic for Account Cards Carousel ---
    const accountCardsContainer = document.querySelector('.account-cards-container');
    // Ensure accountCardsContainer exists before querying its children
    const accountCards = accountCardsContainer ? Array.from(accountCardsContainer.querySelectorAll('.account-card')) : [];
    const accountPagination = document.querySelector('.account-pagination');

    let currentAccountIndex = 0;

    // Helper to get computed styles for card dimensions including margin
    function getCardDimensions() {
        if (accountCards.length === 0) return { cardWidth: 0, cardMarginRight: 0, totalCardWidth: 0 };
        const cardStyle = getComputedStyle(accountCards[0]);
        const cardWidth = accountCards[0].offsetWidth; // Includes padding and border
        // Assumes gap is applied as margin-right to all but the last card, or uses actual gap property
        const gap = parseFloat(cardStyle.marginRight) || 0; // If using margin for gap
        // If using CSS gap property on container, you might need to adjust this:
        // const containerStyle = getComputedStyle(accountCardsContainer);
        // const gap = parseFloat(containerStyle.gap) || 0; // If CSS `gap` is used
        const totalCardWidth = cardWidth + gap; // Card width + space after it
        return { cardWidth, gap, totalCardWidth };
    }

    function showAccountCard(index) {
        if (accountCards.length === 0 || !accountCardsContainer) {
            console.warn("No account cards or container found for carousel. Skipping carousel logic.");
            return;
        }

        // Ensure index is within bounds (looping behavior for carousel)
        currentAccountIndex = (index % accountCards.length + accountCards.length) % accountCards.length;

        const { totalCardWidth } = getCardDimensions();
        const offset = currentAccountIndex * totalCardWidth;

        // Apply the transform to scroll the container
        accountCardsContainer.style.transform = `translateX(-${offset}px)`;
        // Re-enable transition after potential `transition: none` from drag/resize
        accountCardsContainer.style.transition = 'transform 0.5s ease-in-out';

        // Update pagination dots
        if (accountPagination) {
            const dots = accountPagination.querySelectorAll('.dot');
            dots.forEach((dot, dotIndex) => {
                if (dotIndex === currentAccountIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }

    function createPaginationDots() {
        if (!accountPagination) return;

        // Clear existing dots
        accountPagination.innerHTML = '';

        // Only show dots if more than one card
        if (accountCards.length <= 1) {
            return;
        }

        accountCards.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (index === currentAccountIndex) {
                dot.classList.add('active');
            }
            dot.addEventListener('click', () => {
                currentAccountIndex = index;
                showAccountCard(currentAccountIndex);
            });
            accountPagination.appendChild(dot);
        });
    }

    // Initialize carousel if cards are present
    if (accountCards.length > 0) {
        showAccountCard(currentAccountIndex);
        createPaginationDots();

        // Recalculate and update on window resize (important for responsiveness)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Temporarily disable transition during resize to prevent jumps
                if (accountCardsContainer) {
                    accountCardsContainer.style.transition = 'none';
                }
                showAccountCard(currentAccountIndex); // Recalculate offset based on new dimensions
            }, 200); // Debounce resize for better performance
        });

        // --- Touch/Swipe Logic for Account Cards ---
        let touchStartX = 0;
        let touchEndX = 0;
        let isSwiping = false;

        accountCardsContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            isSwiping = true;
            accountCardsContainer.style.transition = 'none'; // Disable transition during drag
        }, { passive: true }); // Use passive listener for better scroll performance

        accountCardsContainer.addEventListener('touchmove', (e) => {
            if (!isSwiping || e.touches.length > 1) return; // Only track single touch swipe

            touchEndX = e.touches[0].clientX;
            const diff = touchEndX - touchStartX;
            const { totalCardWidth } = getCardDimensions();
            const currentOffset = -currentAccountIndex * totalCardWidth;

            // Apply the drag visually by directly manipulating transform
            accountCardsContainer.style.transform = `translateX(${currentOffset + diff}px)`;
        });

        accountCardsContainer.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            isSwiping = false;

            touchEndX = e.changedTouches[0].clientX;
            const swipeThreshold = 50; // Minimum pixels to swipe to trigger a change

            if (touchEndX < touchStartX - swipeThreshold) {
                // Swiped left, move to next card
                currentAccountIndex++;
                showAccountCard(currentAccountIndex);
            } else if (touchEndX > touchStartX + swipeThreshold) {
                // Swiped right, move to previous card
                currentAccountIndex--;
                showAccountCard(currentAccountIndex);
            } else {
                // Not enough swipe, snap back to current card position
                showAccountCard(currentAccountIndex);
            }
        });

        // --- Mouse Drag Logic for Desktop (Optional, but good for completeness) ---
        let isDragging = false;
        let dragStartX = 0;
        let currentTranslate = 0; // Stores the base translateX value before drag starts

        accountCardsContainer.addEventListener('mousedown', (e) => {
            // Only left click (main button)
            if (e.button !== 0) return;

            isDragging = true;
            dragStartX = e.clientX;
            // Get current transform value for smooth continuation
            const transformMatch = accountCardsContainer.style.transform.match(/translateX\(([-.\d]+)px\)/);
            currentTranslate = transformMatch ? parseFloat(transformMatch[1]) : 0;
            accountCardsContainer.style.transition = 'none'; // Disable transition during drag
            accountCardsContainer.style.cursor = 'grabbing'; // Change cursor
        });

        accountCardsContainer.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent text selection during drag
            const dragDistance = e.clientX - dragStartX;
            accountCardsContainer.style.transform = `translateX(${currentTranslate + dragDistance}px)`;
        });

        accountCardsContainer.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            accountCardsContainer.style.cursor = 'grab'; // Reset cursor

            const dragDistance = e.clientX - dragStartX;
            const swipeThreshold = 100; // Adjust for mouse sensitivity

            if (dragDistance < -swipeThreshold) { // Dragged left
                currentAccountIndex++;
            } else if (dragDistance > swipeThreshold) { // Dragged right
                currentAccountIndex--;
            }
            showAccountCard(currentAccountIndex); // Snap to the correct card with transition
        });

        accountCardsContainer.addEventListener('mouseleave', () => {
            // If mouse leaves while dragging, treat it as mouseup to avoid stuck state
            if (isDragging) {
                isDragging = false;
                accountCardsContainer.style.cursor = 'grab';
                showAccountCard(currentAccountIndex);
            }
        });
    } // End of accountCards.length > 0 check


    // --- Transfer Modal Logic ---
    const transferButton = document.getElementById('transferButton');
    const transferModalOverlay = document.getElementById('transferModalOverlay');
    const closeTransferModal = document.getElementById('closeTransferModal');

    if (transferButton && transferModalOverlay && closeTransferModal) {
        transferButton.addEventListener('click', () => {
            transferModalOverlay.classList.add('active');
        });

        closeTransferModal.addEventListener('click', () => {
            transferModalOverlay.classList.remove('active');
        });

        // Close modal if clicking on the overlay itself (outside the content)
        transferModalOverlay.addEventListener('click', (e) => {
            if (e.target === transferModalOverlay) {
                transferModalOverlay.classList.remove('active');
            }
        });

        // Note: The `onclick` attributes in dashboard.php HTML for transfer options
        // are already handling the redirection. If you wanted to manage this purely
        // in JS, you would remove those `onclick`s and add event listeners here.
        // For example:
        /*
        document.querySelectorAll('.transfer-option').forEach(button => {
            button.addEventListener('click', (e) => {
                const transferType = button.dataset.transferType; // Get data-transfer-type
                // Construct URL based on type, e.g., `${BASE_URL_JS}/transfer?type=${transferType}`
                // window.location.href = some_url;
                transferModalOverlay.classList.remove('active'); // Close modal
            });
        });
        */
    }

    // --- Sidebar Logic ---
    const menuIcon = document.getElementById('menuIcon');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (menuIcon && sidebar && closeSidebarBtn && sidebarOverlay) {
        menuIcon.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        });

        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });

        // Close sidebar if clicking on the overlay
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // --- View My Cards Logic ---
    // Make sure the <a> tag in dashboard.php has id="viewMyCardsButton"
    const viewMyCardsButton = document.getElementById('viewMyCardsButton');

    if (viewMyCardsButton) {
        viewMyCardsButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior

           // Check if BASE_URL_JS is defined (it should be, via the PHP script block)
        if (typeof BASE_URL_JS !== 'undefined') {
            window.location.href = `${BASE_URL_JS}/bank_cards`; // Ensure this matches your router
        } else {
            console.error("BASE_URL_JS is not defined. Cannot navigate to bank cards.");
            // Fallback to relative path, though relying on BASE_URL_JS is better
            window.location.href = './bank_cards';
        }
    });
    }
});