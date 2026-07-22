
// NOTE: You do not need to edit this file.

// NASA's APOD API only has images from June 16, 1995 onwards
const earliestDate = '1995-06-16';

// Get today's date in YYYY-MM-DD format (required by date inputs)
const today = new Date().toISOString().split('T')[0];

function setupDateInputs(startInput, endInput) {
  // Restrict date selection range from NASA's first image to today
  startInput.min = earliestDate;
  startInput.max = today;
  endInput.min = earliestDate;
  endInput.max = today;

  // Default: Show the most recent 20 days of space images
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 19); // minus 19 because it includes today
  startInput.value = startDate.toISOString().split('T')[0];
  endInput.value = today;

}
