// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
	const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
	const mainNav = document.querySelector('.main-nav');
	
	if (mobileMenuToggle) {
		mobileMenuToggle.addEventListener('click', function() {
			mainNav.classList.toggle('active');
			this.classList.toggle('active');
		});
	}
	
	// Close mobile menu when clicking on a link
	const navLinks = document.querySelectorAll('.main-nav a');
	navLinks.forEach(link => {
		link.addEventListener('click', function() {
			if (window.innerWidth <= 767) {
				mainNav.classList.remove('active');
				mobileMenuToggle.classList.remove('active');
			}
		});
	});
	
	// Smooth scrolling for anchor links
	document.querySelectorAll('a[href^="#"]').forEach(anchor => {
		anchor.addEventListener('click', function (e) {
			const href = this.getAttribute('href');
			if (href !== '#' && href !== '') {
				e.preventDefault();
				const target = document.querySelector(href);
				if (target) {
					target.scrollIntoView({
						behavior: 'smooth',
						block: 'start'
					});
				}
			}
		});
	});
	
	// Form submission handler
	const contactForm = document.querySelector('.contact-form');
	if (contactForm) {
		contactForm.addEventListener('submit', function(e) {
			e.preventDefault();
			// Here you would normally send the form data to a server
			alert('Спасибо за вашу заявку! Мы свяжемся с вами в ближайшее время.');
			this.reset();
		});
	}
	
	// Favorite button handler
	const favoriteBtn = document.querySelector('.favorite');
	if (favoriteBtn) {
		favoriteBtn.addEventListener('click', function() {
			this.classList.toggle('active');
		});
	}
});

