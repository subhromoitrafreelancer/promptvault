Auth.guardPage(['USER']);
Nav.render();
document.getElementById('welcomeMsg').textContent = 'Welcome back, ' + (Auth.getUsername() || '');
