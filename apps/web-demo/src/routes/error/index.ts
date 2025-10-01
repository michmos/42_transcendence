const params = new URLSearchParams(window.location.search);
const error = params.get('details');
const code = params.get('code');
const type = params.get('type');
const details = params.get('error');

export default function initRoute() {
  if (error) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.textContent = decodeURIComponent(error);
      errorDiv.style.display = 'block';
    }
  }
  if (code) {
    const codeDiv = document.getElementById('error-code');
    if (codeDiv) {
      codeDiv.textContent = code;
      codeDiv.style.display = 'block';
    }
  }
  if (type) {
    const typeDiv = document.getElementById('error-type');
    if (typeDiv) {
      typeDiv.textContent = type;
      typeDiv.style.display = 'block';
    }
  }
  if (details) {
    const detailsDiv = document.getElementById('error-details');
    if (detailsDiv) {
      detailsDiv.textContent = decodeURIComponent(details);
      detailsDiv.style.display = 'block';
    }
  }
}
