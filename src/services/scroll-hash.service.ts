$(window).ready(() => {
    $('a[href^="#rec"]').each((index, anchor) => {
        $(anchor).off('click');

        anchor.addEventListener('click', e => {
            e.preventDefault();

            const target = document.querySelector(anchor.getAttribute('href'));

            const menuHeight = $(window).width() > 980 ? 80 : 60;
            const top = target.getBoundingClientRect().top - menuHeight;

            window.scrollBy({
                top,
                left: 0,
                behavior: 'smooth'
            });
        });

        // because Tilda set a jQuery click event on the button that will override ours
        // So we add ours and delete the addEventListener listener. (TO ENHANCE WITH A BETTER SOLUTION)
        anchor.addEventListener = () => { };
    });
});
