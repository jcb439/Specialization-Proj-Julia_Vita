// Mobile menu toggle
function toggleMenu(){document.getElementById('navSidebar').classList.toggle('active')}

// Close menu when clicking outside (mobile)
document.addEventListener('click',function(e){
  const nav=document.getElementById('navSidebar');const toggle=document.querySelector('.menu-toggle');
  if(!nav.contains(e.target)&&!toggle.contains(e.target)){ if(window.innerWidth<=1024){nav.classList.remove('active')} }
});

// Smooth scroll prevention for hash links in static multi-page
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>e.preventDefault()));

// Hover effects for cards
document.querySelectorAll('.card').forEach(card=>{
  card.addEventListener('mouseenter',()=>card.style.transform='translateY(-5px)');
  card.addEventListener('mouseleave',()=>card.style.transform='translateY(0)');
});

// Book detail toggles
function toggleBookDetails(id){
  const details=document.getElementById(id+'-details');
  document.querySelectorAll('[id$="-details"]').forEach(d=>{ if(d!==details){ d.style.display='none'; } });
  if(details.style.display==='none'||!details.style.display){details.style.display='block';details.style.animation='fadeInUp .5s forwards';}
  else{details.style.display='none';}
}
window.toggleBookDetails = toggleBookDetails;

// Barrier card toggles
function toggleBarrier(id) {
  const content = document.getElementById(id);
  const card = content.parentElement;
  const toggle = card.querySelector('.barrier-toggle');
  
  // Close all other barriers
  document.querySelectorAll('.barrier-content').forEach(barrier => {
    if (barrier !== content && barrier.classList.contains('active')) {
      barrier.classList.remove('active');
      barrier.parentElement.classList.remove('expanded');
      barrier.parentElement.querySelector('.barrier-toggle').textContent = '+';
    }
  });
  
  // Toggle current barrier
  if (content.classList.contains('active')) {
    content.classList.remove('active');
    card.classList.remove('expanded');
    toggle.textContent = '+';
  } else {
    content.classList.add('active');
    card.classList.add('expanded');
    toggle.textContent = '−';
  }
}
window.toggleBarrier = toggleBarrier;