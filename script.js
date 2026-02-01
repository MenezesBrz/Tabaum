document.addEventListener("DOMContentLoaded", () => {
  // Navbar scroll effect
  const nav = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
      if (window.scrollY > 50) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
  });



  // Product cards animation
  const cards = document.querySelectorAll(".product-card");
  const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
          if(entry.isIntersecting){
              entry.target.style.opacity = "1";
              entry.target.style.transform = "translateY(0)";
          }
      });
  }, { threshold: 0.2 });

  cards.forEach(card => {
      card.style.opacity = "0";
      card.style.transform = "translateY(40px)";
      card.style.transition = "0.6s ease";
      observer.observe(card);
  });



  // Advantage cards animation
  const advCards = document.querySelectorAll(".advantage-card");
  const advObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
          if(entry.isIntersecting){
              entry.target.style.opacity = "1";
              entry.target.style.transform = "translateY(0)";
          }
      });
  }, { threshold: 0.2 });
  advCards.forEach(card => advObserver.observe(card));


  
  // Mobile hamburger
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.links');

  toggle.addEventListener('click', () => {
  toggle.classList.toggle('active');
  links.classList.toggle('open');
});
});
