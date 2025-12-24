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
	
	// Translate title attributes
	document.querySelectorAll('[data-translate-title]').forEach(element => {
		const key = element.getAttribute('data-translate-title');
		if (t[key]) {
			element.setAttribute('title', t[key]);
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
	
	// Update privacy and terms links based on language
	const privacyLinks = document.querySelectorAll('.privacy-link, a[href*="privacy-policy"]');
	privacyLinks.forEach(link => {
		if (lang === 'en') {
			link.href = 'privacy-policy-en.html';
		} else if (lang === 'cn') {
			link.href = 'privacy-policy-cn.html';
		} else {
			link.href = 'privacy-policy.html';
		}
	});
	
	const termsLinks = document.querySelectorAll('a[href*="terms-of-use"]');
	termsLinks.forEach(link => {
		if (lang === 'en') {
			link.href = 'terms-of-use-en.html';
		} else if (lang === 'cn') {
			link.href = 'terms-of-use-cn.html';
		} else {
			link.href = 'terms-of-use.html';
		}
	});
}

// Initialize translations
if (typeof translations !== 'undefined') {
	// Add translations to window for access
	window.translations = translations;
}

// Blog articles content
const blogArticles = {
	1: {
		ru: {
			title: "Решаем проблему «Бесплодия» с помощью ЭКО",
			content: "<p>Современные методы экстракорпорального оплодотворения позволяют многим парам обрести счастье родительства. Мы используем передовые технологии и индивидуальный подход к каждой паре.</p><p>ЭКО (экстракорпоральное оплодотворение) — это современный метод лечения бесплодия, который помогает парам, столкнувшимся с проблемами зачатия. Наша клиника использует только проверенные и безопасные методы.</p><p>Процесс включает несколько этапов: стимуляцию овуляции, забор яйцеклеток, оплодотворение в лаборатории и перенос эмбрионов. Каждый этап контролируется опытными специалистами.</p>"
		},
		en: {
			title: "Solving the Problem of Infertility with IVF",
			content: "<p>Modern methods of in vitro fertilization allow many couples to find the happiness of parenthood. We use advanced technologies and an individual approach to each couple.</p><p>IVF (in vitro fertilization) is a modern method of treating infertility that helps couples facing conception problems. Our clinic uses only proven and safe methods.</p><p>The process includes several stages: ovulation stimulation, egg retrieval, fertilization in the laboratory, and embryo transfer. Each stage is controlled by experienced specialists.</p>"
		},
		cn: {
			title: "通过试管婴儿解决不孕问题",
			content: "<p>现代体外受精方法使许多夫妇能够找到为人父母的幸福。我们对每对夫妇使用先进技术和个性化方法。</p><p>试管婴儿（体外受精）是一种治疗不孕的现代方法，帮助面临受孕问题的夫妇。我们的诊所只使用经过验证的安全方法。</p><p>该过程包括几个阶段：促排卵、取卵、实验室受精和胚胎移植。每个阶段都由经验丰富的专家控制。</p>"
		}
	},
	2: {
		ru: {
			title: "Донорство / суррогатное материнство",
			content: "<p>Профессиональная поддержка на всех этапах программы донорства и суррогатного материнства. Полное юридическое и медицинское сопровождение.</p><p>Донорство ооцитов и суррогатное материнство — это сложные процессы, требующие профессионального подхода. Мы обеспечиваем полное сопровождение на всех этапах.</p><p>Наша команда включает опытных врачей, юристов и психологов, которые работают вместе, чтобы обеспечить успешный результат для всех участников программы.</p>"
		},
		en: {
			title: "Donation / Surrogacy",
			content: "<p>Professional support at all stages of the donation and surrogacy program. Full legal and medical support.</p><p>Egg donation and surrogacy are complex processes that require a professional approach. We provide full support at all stages.</p><p>Our team includes experienced doctors, lawyers, and psychologists who work together to ensure a successful outcome for all program participants.</p>"
		},
		cn: {
			title: "捐赠 / 代孕",
			content: "<p>在捐赠和代孕项目的所有阶段提供专业支持。完整的法律和医疗支持。</p><p>卵子捐赠和代孕是复杂的流程，需要专业方法。我们在所有阶段提供全面支持。</p><p>我们的团队包括经验丰富的医生、律师和心理学家，他们共同努力确保所有项目参与者的成功结果。</p>"
		}
	},
	3: {
		ru: {
			title: "ЗАРОЖДЕНИЕ — ваш надежный партнер",
			content: "<p>Мы помогаем парам обрести счастье родительства с помощью современных репродуктивных технологий. Более 10 лет опыта в области репродуктивной медицины.</p><p>ЗАРОЖДЕНИЕ — это команда профессионалов, которая помогает парам стать родителями. Мы используем только проверенные методы и индивидуальный подход к каждому случаю.</p><p>Наш опыт и профессионализм позволяют нам достигать высоких результатов. Мы гордимся тем, что помогаем создавать новые семьи.</p>"
		},
		en: {
			title: "ZAROZHDENIE — Your Reliable Partner",
			content: "<p>We help couples find the happiness of parenthood through modern reproductive technologies. More than 10 years of experience in reproductive medicine.</p><p>ZAROZHDENIE is a team of professionals who help couples become parents. We use only proven methods and an individual approach to each case.</p><p>Our experience and professionalism allow us to achieve high results. We are proud to help create new families.</p>"
		},
		cn: {
			title: "起源 — 您的可靠合作伙伴",
			content: "<p>我们通过现代生殖技术帮助夫妇找到为人父母的幸福。在生殖医学领域拥有超过10年的经验。</p><p>起源是一个专业团队，帮助夫妇成为父母。我们只使用经过验证的方法和对每个案例的个性化方法。</p><p>我们的经验和专业性使我们能够取得高成果。我们为帮助创建新家庭而感到自豪。</p>"
		}
	}
};

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
	// Translate page on load
	if (typeof translations !== 'undefined' && translations[currentLang]) {
		try {
			translatePage(currentLang);
		} catch (error) {
			console.error('Translation error:', error);
		}
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
	
	// Smooth scrolling for anchor links (excluding language buttons and blog links)
	document.querySelectorAll('a[href^="#"]').forEach(anchor => {
		anchor.addEventListener('click', function (e) {
			const href = this.getAttribute('href');
			// Skip if it's a language button or blog link
			if (this.classList.contains('lang-btn') || this.classList.contains('blog-link')) {
				return;
			}
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
	
	// Blog modal functionality
	const blogModal = document.getElementById('blog-modal');
	const blogLinks = document.querySelectorAll('.blog-link');
	const closeModal = document.querySelector('.blog-modal-close');
	
	blogLinks.forEach(link => {
		link.addEventListener('click', function(e) {
			e.preventDefault();
			const articleId = this.getAttribute('data-article');
			const article = blogArticles[articleId];
			
			if (article && article[currentLang]) {
				const modalBody = document.getElementById('blog-modal-body');
				modalBody.innerHTML = `
					<h2>${article[currentLang].title}</h2>
					${article[currentLang].content}
				`;
				blogModal.style.display = 'block';
				document.body.style.overflow = 'hidden';
			}
		});
	});
	
	if (closeModal) {
		closeModal.addEventListener('click', function() {
			blogModal.style.display = 'none';
			document.body.style.overflow = 'auto';
		});
	}
	
	// Close modal when clicking outside
	window.addEventListener('click', function(e) {
		if (e.target === blogModal) {
			blogModal.style.display = 'none';
			document.body.style.overflow = 'auto';
		}
	});
	
	// Form submission handler
	const contactForm = document.getElementById('main-contact-form');
	if (contactForm) {
		contactForm.addEventListener('submit', function(e) {
			e.preventDefault();
			const nameInput = this.querySelector('input[name="name"]');
			const phoneInput = this.querySelector('input[name="phone"]');
			const name = nameInput.value.trim();
			const phone = phoneInput.value.trim();
			
			// Basic validation
			if (!name || name.length < 2) {
				let errorMsg = 'Пожалуйста, введите ваше имя (минимум 2 символа).';
				if (currentLang === 'en') {
					errorMsg = 'Please enter your name (minimum 2 characters).';
				} else if (currentLang === 'cn') {
					errorMsg = '请输入您的姓名（至少2个字符）。';
				}
				alert(errorMsg);
				nameInput.focus();
				return;
			}
			
			// Phone validation (basic - should start with + or contain digits)
			const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
			if (!phone || !phoneRegex.test(phone)) {
				let errorMsg = 'Пожалуйста, введите корректный номер телефона.';
				if (currentLang === 'en') {
					errorMsg = 'Please enter a valid phone number.';
				} else if (currentLang === 'cn') {
					errorMsg = '请输入有效的电话号码。';
				}
				alert(errorMsg);
				phoneInput.focus();
				return;
			}
			
			// Get translated message
			let message = 'Спасибо за вашу заявку! Мы свяжемся с вами в ближайшее время.';
			if (currentLang === 'en') {
				message = 'Thank you for your request! We will contact you soon.';
			} else if (currentLang === 'cn') {
				message = '感谢您的请求！我们会尽快与您联系。';
			}
			
			// Here you can add actual form submission logic (e.g., send to server)
			// For now, we'll show an alert and optionally send to WhatsApp
			alert(message);
			
			// Optional: Open WhatsApp with pre-filled message
			const whatsappMessage = encodeURIComponent(`Здравствуйте! Меня зовут ${name}, мой телефон: ${phone}. Хочу получить консультацию.`);
			window.open(`https://wa.me/77078799987?text=${whatsappMessage}`, '_blank');
			
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
	
	// Fix logo link
	const logoLink = document.querySelector('.logo-link');
	if (logoLink) {
		logoLink.addEventListener('click', function(e) {
			e.preventDefault();
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		});
	}
	
	// Load Instagram background images for contact cards
	const contactCards = document.querySelectorAll('.contact-card[data-instagram-bg]');
	contactCards.forEach(card => {
		const bgUrl = card.getAttribute('data-instagram-bg');
		if (bgUrl) {
			// Set CSS variable for ::before pseudo-element
			card.style.setProperty('--bg-image', `url(${bgUrl})`);
			
			// Preload image to ensure it's ready
			const bgImage = new Image();
			bgImage.onload = function() {
				// Image loaded successfully, CSS variable is already set
			};
			bgImage.onerror = function() {
				// Fallback to gradient if image fails to load
				card.style.setProperty('--bg-image', 'linear-gradient(135deg, rgba(107, 76, 138, 0.1) 0%, rgba(64, 42, 84, 0.1) 100%)');
			};
			bgImage.src = bgUrl;
		}
	});
	
	// Load background images for service cards
	const serviceCards = document.querySelectorAll('.service-card[data-service-bg]');
	serviceCards.forEach(card => {
		const bgUrl = card.getAttribute('data-service-bg');
		if (bgUrl) {
			// Set CSS variable for ::before pseudo-element
			card.style.setProperty('--service-bg-image', `url(${bgUrl})`);
			
			// Preload image to ensure it's ready
			const bgImage = new Image();
			bgImage.onload = function() {
				// Image loaded successfully, CSS variable is already set
			};
			bgImage.onerror = function() {
				// Fallback to gradient if image fails to load
				card.style.setProperty('--service-bg-image', 'linear-gradient(135deg, rgba(107, 76, 138, 0.1) 0%, rgba(64, 42, 84, 0.1) 100%)');
			};
			bgImage.src = bgUrl;
		}
	});
	
	// Load background images for benefit items
	const benefitItems = document.querySelectorAll('.benefit-item[data-benefit-bg]');
	benefitItems.forEach(item => {
		const bgUrl = item.getAttribute('data-benefit-bg');
		if (bgUrl) {
			item.style.setProperty('--benefit-bg-image', `url(${bgUrl})`);
			const bgImage = new Image();
			bgImage.onload = function() {};
			bgImage.onerror = function() {
				item.style.setProperty('--benefit-bg-image', 'linear-gradient(135deg, rgba(107, 76, 138, 0.1) 0%, rgba(64, 42, 84, 0.1) 100%)');
			};
			bgImage.src = bgUrl;
		}
	});
	
	// Load background images for steps
	const steps = document.querySelectorAll('.step[data-step-bg]');
	steps.forEach(step => {
		const bgUrl = step.getAttribute('data-step-bg');
		if (bgUrl) {
			step.style.setProperty('--step-bg-image', `url(${bgUrl})`);
			const bgImage = new Image();
			bgImage.onload = function() {};
			bgImage.onerror = function() {
				step.style.setProperty('--step-bg-image', 'linear-gradient(135deg, rgba(107, 76, 138, 0.1) 0%, rgba(64, 42, 84, 0.1) 100%)');
			};
			bgImage.src = bgUrl;
		}
	});
	
	// Reviews slider functionality
	const reviewsSlider = document.getElementById('reviews-slider');
	const prevBtn = document.getElementById('prev-review');
	const nextBtn = document.getElementById('next-review');
	const reviewsDots = document.getElementById('reviews-dots');
	
	let currentReviewIndex = 0;
	let reviewImages = [];
	
	// Function to load review images based on language
	function loadReviews() {
		const reviewFolder = currentLang === 'ru' ? 'reviews/ru' : 'reviews/en-cn';
		reviewImages = [];
		
		// Try to load images (assuming they will be named review-1.jpg, review-2.jpg, etc.)
		// We'll check for common image extensions
		const extensions = ['jpg', 'jpeg', 'png', 'webp'];
		let imageIndex = 1;
		let loadedCount = 0;
		const maxAttempts = 20; // Maximum number of images to try
		
		function tryLoadImage(index) {
			if (index > maxAttempts) {
			if (reviewImages.length === 0) {
				// If no images found, show placeholder
				const placeholderText = currentLang === 'ru' ? 'Отзывы скоро появятся' : 
				                       currentLang === 'cn' ? '评论即将推出' : 'Reviews coming soon';
				reviewsSlider.innerHTML = `<div class="review-item"><p>${placeholderText}</p></div>`;
			} else {
				renderReviews();
			}
				return;
			}
			
			let found = false;
			let extIndex = 0;
			
			function tryExtension() {
				if (extIndex >= extensions.length) {
					if (!found) {
						// Try next image number
						tryLoadImage(index + 1);
					}
					return;
				}
				
				const ext = extensions[extIndex];
				const imgPath = `${reviewFolder}/review-${index}.${ext}`;
				const img = new Image();
				
				img.onload = function() {
					if (!found) {
						found = true;
						reviewImages.push(imgPath);
						loadedCount++;
						renderReviews();
						// Continue loading more images
						tryLoadImage(index + 1);
					}
				};
				
				img.onerror = function() {
					extIndex++;
					tryExtension();
				};
				
				img.src = imgPath;
			}
			
			tryExtension();
		}
		
		tryLoadImage(1);
	}
	
	// Function to render reviews
	function renderReviews() {
		if (reviewImages.length === 0) return;
		
		reviewsSlider.innerHTML = '';
		reviewImages.forEach((imgPath, index) => {
			const reviewItem = document.createElement('div');
			reviewItem.className = 'review-item';
			reviewItem.innerHTML = `<img src="${imgPath}" alt="Review ${index + 1}" class="review-image">`;
			reviewsSlider.appendChild(reviewItem);
		});
		
		// Update dots
		reviewsDots.innerHTML = '';
		for (let i = 0; i < reviewImages.length; i++) {
			const dot = document.createElement('div');
			dot.className = `review-dot ${i === currentReviewIndex ? 'active' : ''}`;
			dot.addEventListener('click', () => goToReview(i));
			reviewsDots.appendChild(dot);
		}
		
		updateSliderPosition();
		updateButtons();
	}
	
	// Function to update slider position
	function updateSliderPosition() {
		if (reviewImages.length === 0) return;
		const itemWidth = reviewsSlider.offsetWidth;
		reviewsSlider.scrollLeft = currentReviewIndex * itemWidth;
	}
	
	// Function to update navigation buttons
	function updateButtons() {
		if (prevBtn) prevBtn.disabled = currentReviewIndex === 0;
		if (nextBtn) nextBtn.disabled = currentReviewIndex >= reviewImages.length - 1;
	}
	
	// Function to go to specific review
	function goToReview(index) {
		if (index < 0 || index >= reviewImages.length) return;
		currentReviewIndex = index;
		updateSliderPosition();
		updateButtons();
		
		// Update dots
		document.querySelectorAll('.review-dot').forEach((dot, i) => {
			dot.classList.toggle('active', i === index);
		});
	}
	
	// Navigation functions
	function nextReview() {
		if (currentReviewIndex < reviewImages.length - 1) {
			goToReview(currentReviewIndex + 1);
		}
	}
	
	function prevReview() {
		if (currentReviewIndex > 0) {
			goToReview(currentReviewIndex - 1);
		}
	}
	
	// Event listeners
	if (nextBtn) {
		nextBtn.addEventListener('click', nextReview);
	}
	
	if (prevBtn) {
		prevBtn.addEventListener('click', prevReview);
	}
	
	// Auto-play functionality (optional)
	let autoPlayInterval;
	function startAutoPlay() {
		autoPlayInterval = setInterval(() => {
			if (currentReviewIndex < reviewImages.length - 1) {
				nextReview();
			} else {
				goToReview(0);
			}
		}, 5000); // Change slide every 5 seconds
	}
	
	function stopAutoPlay() {
		if (autoPlayInterval) {
			clearInterval(autoPlayInterval);
		}
	}
	
	// Pause auto-play on hover
	if (reviewsSlider) {
		reviewsSlider.addEventListener('mouseenter', stopAutoPlay);
		reviewsSlider.addEventListener('mouseleave', () => {
			if (reviewImages.length > 1) {
				startAutoPlay();
			}
		});
	}
	
	// Store original translatePage function
	const originalTranslatePage = translatePage;
	
	// Override translatePage to reload reviews
	window.translatePage = function(lang) {
		originalTranslatePage(lang);
		currentReviewIndex = 0;
		loadReviews();
	};
	
	// Load reviews on page load
	loadReviews();
	
	// Handle window resize
	let resizeTimeout;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			updateSliderPosition();
		}, 250);
	});
});
