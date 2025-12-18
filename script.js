// Language switching functionality
let currentLang = localStorage.getItem('language') || 'ru';

// Function to translate the page
function translatePage(lang) {
	currentLang = lang;
	localStorage.setItem('language', lang);
	
	const t = translations[lang];
	if (!t) return;
	
	// Update HTML lang attribute
	document.getElementById('html-lang').setAttribute('lang', lang);
	
	// Translate all elements with data-translate attribute
	document.querySelectorAll('[data-translate]').forEach(element => {
		const key = element.getAttribute('data-translate');
		if (t[key]) {
			element.textContent = t[key];
		}
	});
	
	// Translate placeholders
	document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
		const key = element.getAttribute('data-translate-placeholder');
		if (t[key]) {
			element.setAttribute('placeholder', t[key]);
		}
	});
	
	// Translate input values
	document.querySelectorAll('[data-translate-value]').forEach(element => {
		const key = element.getAttribute('data-translate-value');
		if (t[key]) {
			element.setAttribute('value', t[key]);
		}
	});
	
	// Update page title and description
	if (t.pageTitle) {
		document.title = t.pageTitle;
	}
	const metaDesc = document.querySelector('meta[name="description"]');
	if (metaDesc && t.pageDescription) {
		metaDesc.setAttribute('content', t.pageDescription);
	}
	
	// Update active language button
	document.querySelectorAll('.lang-btn').forEach(btn => {
		btn.classList.remove('active');
		if (btn.getAttribute('data-lang') === lang) {
			btn.classList.add('active');
		}
	});
}

// Initialize translations
if (typeof translations !== 'undefined') {
	// Add translations to window for access
	window.translations = translations;
}

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
	// Translate page on load
	if (typeof translations !== 'undefined') {
		translatePage(currentLang);
	}
	
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
	
	// Language switcher
	document.querySelectorAll('.lang-btn').forEach(btn => {
		btn.addEventListener('click', function(e) {
			e.preventDefault();
			const lang = this.getAttribute('data-lang');
			translatePage(lang);
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
			const name = this.querySelector('input[name="name"]').value;
			const phone = this.querySelector('input[name="phone"]').value;
			
			// Get translated message
			let message = 'Спасибо за вашу заявку! Мы свяжемся с вами в ближайшее время.';
			if (currentLang === 'en') {
				message = 'Thank you for your request! We will contact you soon.';
			} else if (currentLang === 'cn') {
				message = '感谢您的请求！我们会尽快与您联系。';
			}
			
			alert(message);
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
