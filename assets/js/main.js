const navToggle = document.getElementById("nav-toggle");
const navMenu   = document.getElementById("nav-menu");
const navClose  = document.getElementById("nav-close");

// Mostrar MENU
if (navToggle) {
	navToggle.addEventListener("click", () => {
		navMenu.classList.add("show-menu");
	});
}

// Ocultar MENU
if (navClose) {
	navClose.addEventListener("click", () => {
		navMenu.classList.remove("show-menu");
	});
}

// Remover MENU de link

const navLink = document.querySelectorAll(".nav__link");
function linkAction() {
	const navMenu = document.getElementById("nav-menu");
	navMenu.classList.remove("show-menu");
}

for (const item of navLink) {
	item.addEventListener("click", linkAction);
}

// Scroll Reveal

const sr = ScrollReveal({
	distance: "90px",
	duration: 3000,
});

sr.reveal(".home__data", { origin: "top", delay: 400 });
sr.reveal(".home__img", { origin: "bottom", delay: 600 });
sr.reveal(".home__footer", { origin: "bottom", delay: 800 });
