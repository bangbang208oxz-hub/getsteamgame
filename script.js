const menuBtn = document.getElementById('mobile-menu');
const navList = document.getElementById('nav-list');

const PROTECTED_PAGES = {
    'howtoinstall.html': 'How to install',
    'more.html': 'More',
    'loginhistory.html': 'Login History'
};

function handlePageTransition(url) {
    if (PROTECTED_PAGES[url] && !isLoggedIn()) {
        showNotification(`Please login with Discord to access ${PROTECTED_PAGES[url]} page`);
        return;
    }

    const transition = document.getElementById('page-transition');
    if (!transition) {
        window.location.href = url;
        return;
    }

    transition.classList.add('active');

    setTimeout(() => {
        transition.classList.remove('active');
        transition.classList.add('exit');
        window.location.href = url;
    }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav a[href]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetUrl = link.getAttribute('href');
            if (targetUrl && targetUrl !== '#' && !targetUrl.startsWith('http')) {
                e.preventDefault();
                handlePageTransition(targetUrl);
            }
        });
    });

    const logoLink = document.querySelector('.logo');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            const targetUrl = logoLink.getAttribute('href');
            if (targetUrl && targetUrl !== '#' && !targetUrl.startsWith('http')) {
                e.preventDefault();
                handlePageTransition(targetUrl);
            }
        });
    }

    const transition = document.getElementById('page-transition');
    if (transition) {
        setTimeout(() => {
            transition.classList.add('exit');
            setTimeout(() => {
                transition.classList.remove('exit');
            }, 600);
        }, 100);
    }
});

function startCounter() {
    const counters = document.querySelectorAll('.num');

    counters.forEach(counter => {
        const counterType = counter.getAttribute('data-counter');

        if (counterType === 'experience') {
            const startDate = new Date(counter.getAttribute('data-start'));

            const updateExperience = () => {
                const now = new Date();
                const diffTime = Math.abs(now - startDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const years = Math.floor(diffDays / 365);
                const months = Math.floor((diffDays % 365) / 30);

                if (years > 0) {
                    counter.innerText = `${years}Y ${months}M`;
                } else {
                    counter.innerText = `${months}M`;
                }
            };

            updateExperience();
            setInterval(updateExperience, 60000);
            return;
        }

        const target = +counter.getAttribute('data-target');
        const suffix = counter.getAttribute('data-suffix') || "";
        const prefix = counter.getAttribute('data-prefix') || "";

        const duration = 800;
        const startTime = performance.now();

        const updateCount = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentNum = Math.floor(progress * target);

            if (suffix === '' && prefix === '') {
                counter.innerText = currentNum.toLocaleString();
            } else {
                counter.innerText = prefix + currentNum + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                if (suffix === '' && prefix === '') {
                    counter.innerText = target.toLocaleString();
                } else {
                    counter.innerText = prefix + target + suffix;
                }
            }
        };

        requestAnimationFrame(updateCount);
    });
}

menuBtn.addEventListener('click', () => {
    navList.classList.toggle('active');
    if (navList.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
});

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

const DISCORD_CLIENT_ID = '1510107330161672252';
const REDIRECT_URI = window.location.origin + '/index.html';

function handleAuth() {
    if (isLoggedIn()) {
        toggleDropdown();
    } else {
        login();
    }
}

function toggleDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

function closeDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    dropdown.style.display = 'none';
}

function login() {
    const scope = 'identify';
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${scope}`;
    window.location.href = authUrl;
}

function logout() {
    localStorage.removeItem('discord_token');
    localStorage.removeItem('discord_user');
    closeDropdown();
    updateAuthButton();
    showNotification('Logged out successfully');
}

function isLoggedIn() {
    return localStorage.getItem('discord_token') !== null;
}

function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    const dropdown = document.getElementById('dropdown-menu');

    if (isLoggedIn()) {
        const user = JSON.parse(localStorage.getItem('discord_user'));
        authBtn.innerText = user ? user.username : 'User';
        dropdown.style.display = 'none';
    } else {
        authBtn.innerText = 'Login';
        dropdown.style.display = 'none';
    }
}

function handleTokenFromUrl() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');

    if (token) {
        localStorage.setItem('discord_token', token);

        fetch('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(user => {
                localStorage.setItem('discord_user', JSON.stringify(user));

                const userId = user.id;
                const loggedUsers = JSON.parse(localStorage.getItem('logged_users') || '[]');
                if (!loggedUsers.includes(userId)) {
                    loggedUsers.push(userId);
                    localStorage.setItem('logged_users', JSON.stringify(loggedUsers));
                    const memberCount = parseInt(localStorage.getItem('member_count') || '0') + 1;
                    localStorage.setItem('member_count', memberCount.toString());
                    updateMemberCount();
                }

                const loginHistory = JSON.parse(localStorage.getItem('login_history') || '[]');

                fetch('https://ipapi.co/json/')
                    .then(response => response.json())
                    .then(ipData => {
                        loginHistory.push({
                            userId: user.id,
                            username: user.username,
                            avatar: user.avatar,
                            ip: ipData.ip || 'N/A',
                            location: ipData.region || ipData.city || 'N/A',
                            country: ipData.country_name || 'N/A',
                            timestamp: new Date().toISOString()
                        });
                        localStorage.setItem('login_history', JSON.stringify(loginHistory));
                    })
                    .catch(() => {
                        loginHistory.push({
                            userId: user.id,
                            username: user.username,
                            avatar: user.avatar,
                            ip: 'N/A',
                            location: 'N/A',
                            country: 'N/A',
                            timestamp: new Date().toISOString()
                        });
                        localStorage.setItem('login_history', JSON.stringify(loginHistory));
                    });

                window.location.hash = '';
                updateAuthButton();
            })
            .catch(err => console.error('Error fetching user:', err));
    }
}

function updateMemberCount() {
    const memberCount = parseInt(localStorage.getItem('member_count') || '0');
    const memberCounter = document.querySelector('.num[data-suffix=""]');
    if (memberCounter) {
        memberCounter.setAttribute('data-target', memberCount);
        memberCounter.innerText = '0';
        setTimeout(() => {
            startCounter();
        }, 100);
    }
}

function resetMemberCount() {
    localStorage.setItem('member_count', '0');
    localStorage.setItem('logged_users', '[]');
    updateMemberCount();
}

window.addEventListener('load', () => {
    handleTokenFromUrl();
    updateAuthButton();
    updateMemberCount();

    const currentPage = window.location.pathname.split('/').pop();
    const PROTECTED_PAGES = {
        'howtoinstall.html': 'How to install',
        'more.html': 'More'
    };

    if (PROTECTED_PAGES[currentPage] && !isLoggedIn()) {
        showNotification(`Please login with Discord to access ${PROTECTED_PAGES[currentPage]} page`);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
});

document.addEventListener('click', (e) => {
    const authDropdown = document.querySelector('.auth-dropdown');
    if (!authDropdown.contains(e.target)) {
        closeDropdown();
    }
});

function handleDownload(lang) {
    showNotification(`${lang === 'th' ? 'กำลังดาวน์โหลด...' : 'Downloading...'} ${lang === 'th' ? 'โปรแกรม' : 'program'}`);
    window.open(lang === 'th' ? 'https://your-download-link-th' : 'https://your-download-link-en', '_blank');
}

window.addEventListener('DOMContentLoaded', startCounter);
