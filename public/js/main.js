document.addEventListener('DOMContentLoaded', function () {
  const navBurger = document.getElementById('nav-burger');
  const navMenu = document.getElementById('nav-menu');

  if (navBurger) {
    navBurger.addEventListener('click', function () {
      navMenu.classList.toggle('active');
    });
  }

  if (navMenu) {
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach((link) => {
      link.addEventListener('click', function () {
        navMenu.classList.remove('active');
      });
    });
  }

  const closeButtons = document.querySelectorAll('.close-btn');
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
      this.parentElement.style.display = 'none';
    });
  });

  const flashMessages = document.querySelectorAll('.flash-message');
  flashMessages.forEach((msg) => {
    setTimeout(function () {
      msg.style.opacity = '0';
      setTimeout(() => (msg.style.display = 'none'), 300);
    }, 5000);
  });
});
