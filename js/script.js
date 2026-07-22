// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const getImagesButton = document.querySelector('button');
const spaceFactText = document.getElementById('spaceFactText');
const modal = document.createElement('div');

// Your NASA API key
const apiKey = 'GjtNucJGHlvDBh8dKaEeBDDS3WAIceetA8oqdpHf';

// A new fact is chosen each time the page is refreshed.
const spaceFacts = [
	'One day on Venus is longer than one year on Venus.',
	'The footprints left by Apollo astronauts can remain on the Moon for millions of years.',
	'The Sun holds about 99.8% of all the mass in our solar system.',
	'Neutron stars can spin hundreds of times every second.',
	'Saturn could float in water because its average density is lower than water.',
	'Light from the Sun takes about eight minutes and twenty seconds to reach Earth.'
];

// Store the latest image set so a clicked card can open the matching modal content
let currentGalleryItems = [];

// Add modal markup to the page once, then reuse it for every clicked gallery item
modal.className = 'image-modal hidden';
modal.innerHTML = `
	<div class="modal-backdrop" data-close-modal="true"></div>
	<div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
		<button class="modal-close" aria-label="Close image details">×</button>
		<img id="modalImage" src="" alt="" />
		<h2 id="modalTitle"></h2>
		<p class="modal-date" id="modalDate"></p>
		<p class="modal-explanation" id="modalExplanation"></p>
	</div>
`;
document.body.appendChild(modal);

const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalCloseButton = modal.querySelector('.modal-close');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Pick a random fact from the array and display it above the gallery.
function showRandomSpaceFact() {
	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	spaceFactText.textContent = spaceFacts[randomIndex];
}

showRandomSpaceFact();

// Turn supported YouTube links into URLs that can play inside an iframe
function getVideoEmbedUrl(videoUrl) {
	try {
		const url = new URL(videoUrl);
		const hostname = url.hostname.toLowerCase();

		if (hostname === 'youtu.be') {
			return `https://www.youtube.com/embed${url.pathname}`;
		}

		if (hostname.includes('youtube.com') && url.pathname === '/watch') {
			return `https://www.youtube.com/embed/${url.searchParams.get('v')}`;
		}

		if (hostname.includes('youtube.com') && url.pathname.startsWith('/embed/')) {
			return videoUrl;
		}

		// Other video sites may block iframe embedding with security settings.
		return '';
	} catch (error) {
		// Keep rendering the gallery if one video entry has an unusual URL.
		console.error('Could not create an embedded video URL:', error);
		return '';
	}
}

// Check whether APOD gave us a direct video file that the browser can play.
function isDirectVideoFile(videoUrl) {
	try {
		const url = new URL(videoUrl);
		return /\.(mp4|webm|ogg)$/i.test(url.pathname);
	} catch (error) {
		return false;
	}
}

// Build one gallery card and return it as HTML
function createGalleryItem(item) {
	if (item.media_type === 'video') {
		const embedUrl = getVideoEmbedUrl(item.url);
		let videoContent = '<p class="video-unavailable">This video is available on NASA\'s APOD page.</p>';

		if (isDirectVideoFile(item.url)) {
			videoContent = `
				<video class="video-player" controls preload="metadata">
					<source src="${item.url}" type="video/mp4" />
					Your browser does not support this video format.
				</video>
			`;
		} else if (embedUrl) {
			videoContent = `
				<iframe
					class="video-player"
					src="${embedUrl}"
					title="${item.title}"
					loading="lazy"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen>
				</iframe>
			`;
		}

		return `
			<article class="gallery-item video-item">
				${videoContent}
				<p><strong>${item.title}</strong></p>
				<p>${item.date}</p>
				<a class="video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">Open video in a new tab</a>
			</article>
		`;
	}

	return `
		<article class="gallery-item" data-date="${item.date}" tabindex="0" role="button" aria-label="Open details for ${item.title}">
			<div class="image-frame">
				<img src="${item.url}" alt="${item.title}" loading="lazy" />
			</div>
			<p><strong>${item.title}</strong></p>
			<p>${item.date}</p>
		</article>
	`;
}

function openModal(item) {
	modalImage.src = item.hdurl || item.url;
	modalImage.alt = item.title;
	modalTitle.textContent = item.title;
	modalDate.textContent = item.date;
	modalExplanation.textContent = item.explanation;
	modal.classList.remove('hidden');
	document.body.classList.add('modal-open');
}

function closeModal() {
	modal.classList.add('hidden');
	document.body.classList.remove('modal-open');
}

// Show a simple message in the gallery area
function showGalleryMessage(message) {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">🛰️</div>
			<p>${message}</p>
		</div>
	`;
}

// Fetch APOD data and render image cards
async function loadSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	// Basic guard in case inputs are empty
	if (!startDate || !endDate) {
		showGalleryMessage('Please choose both a start date and an end date.');
		return;
	}

	showGalleryMessage('🔄 Loading space photos...');

	try {
		const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error('Failed to fetch data from NASA.');
		}

		const apodData = await response.json();

		if (apodData.length === 0) {
			showGalleryMessage('No space photos or videos were found for this date range. Try another range.');
			return;
		}

		// Show newest dates first, including both images and videos
		const newestFirst = apodData.reverse();
		currentGalleryItems = newestFirst;

		// Convert every image object into HTML cards, then display them
		const galleryHtml = newestFirst.map((item) => createGalleryItem(item)).join('');
		gallery.innerHTML = galleryHtml;
	} catch (error) {
		showGalleryMessage('Something went wrong while loading images. Please try again.');
		console.error(error);
	}
}

// Open the modal when a gallery item is clicked
gallery.addEventListener('click', (event) => {
	const card = event.target.closest('.gallery-item');
	if (!card) {
		return;
	}

	const selectedDate = card.getAttribute('data-date');
	const selectedItem = currentGalleryItems.find((item) => item.date === selectedDate);

	if (selectedItem && selectedItem.media_type === 'image') {
		openModal(selectedItem);
	}
});

// Keyboard support: Enter on focused card opens the modal
gallery.addEventListener('keydown', (event) => {
	if (event.key !== 'Enter') {
		return;
	}

	const card = event.target.closest('.gallery-item');
	if (!card) {
		return;
	}

	const selectedDate = card.getAttribute('data-date');
	const selectedItem = currentGalleryItems.find((item) => item.date === selectedDate);

	if (selectedItem && selectedItem.media_type === 'image') {
		openModal(selectedItem);
	}
});

// Close when the user clicks the X button or the dark backdrop
modal.addEventListener('click', (event) => {
	if (event.target.classList.contains('modal-close') || event.target.dataset.closeModal === 'true') {
		closeModal();
	}
});

// Close with Escape key for quick keyboard access
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
		closeModal();
	}
});

// Close button event (kept separate for clarity for beginners)
modalCloseButton.addEventListener('click', closeModal);

// Run when the user clicks the button
getImagesButton.addEventListener('click', loadSpaceImages);

// Optional: load default range as soon as the page opens
loadSpaceImages();
