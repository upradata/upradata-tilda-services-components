export const loadScrollHashService = () => {
    $(window).ready(() => {
        const links = $('a[href^="#rec"]').toArray().concat($('a[href^="/#rec"]').toArray());

        for (const anchor of links) {
            $(anchor).off('click'); // we remove previous click handler from jquery to replace with a better solution

            anchor.addEventListener('click', e => {
                e.preventDefault();

                const id = anchor.getAttribute('href').replace(/^\//, '');
                const target = document.querySelector(id);

                if (!target) {
                    console.warn(`the link with href="${anchor.getAttribute('href')}" has no targets node with id="${id}"`);
                    return;
                }

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
        }
    });
};
