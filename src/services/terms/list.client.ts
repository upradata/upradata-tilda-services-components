import { Terms, Type, SubSection, Section, Alinea } from '@upradata/tilda-tools';

function newSection(section: Section) {
    return document.createTextNode(section.title);
}

function newSubSection(subSection: SubSection) {
    const div = document.createElement('div');

    div.innerHTML = `
            <span class="mt-subsection-number">${subSection.nb}</span>
            <div class="mt-subsection-content">
                <span class="mt-subsection-title">${subSection.title}</span>
                <span class="mt-subsection-description">${subSection.description}</span>
            </div>
            `.trim();

    return div;
}


function newAlinea(alinea: Alinea) {
    const div = document.createElement('div');

    div.innerHTML = `
            <span class="mt-letter-subsection-title">${alinea.letter}</span>
            <span class="mt-letter-subsection-description">${alinea.description}</span>
        `.trim();

    return div;
}

let itemModel: HTMLElement = undefined;

function cleanNode(node: Element) {
    // var clone = node.cloneNode(false);
    // node.parentNode.replaceChild(clone, node);
    node.innerHTML = '';
}

function createItem(title: Text, description: DocumentFragment) {
    const newItem = itemModel.cloneNode(true) as HTMLElement;
    newItem.removeAttribute('id');
    newItem.style.removeProperty('display');

    const titlePlaceHolder = newItem.querySelector('#mt-item-title');
    const descriptionPlaceHolder = newItem.querySelector('#mt-item-description');

    titlePlaceHolder.removeAttribute('id');
    descriptionPlaceHolder.removeAttribute('id');

    titlePlaceHolder.appendChild(title);
    descriptionPlaceHolder.appendChild(description);

    return newItem;
}


function addItem(itemsFragment: DocumentFragment, title: Text, descriptionFrag: DocumentFragment) {
    const item = createItem(title, descriptionFrag);
    itemsFragment.appendChild(item);
}

function insertItems(itemsFragment: DocumentFragment) {
    const list = document.querySelector('#mt-item-list');
    cleanNode(list);

    list.appendChild(itemsFragment);
}


function addIntro(introEl: HTMLElement) {
    const title = introEl.querySelector('h1');
    title.parentNode.removeChild(title);

    const intro = document.querySelector('#mt-term-intro');
    intro.innerHTML = '';
    intro.appendChild(introEl);
}


export function createList(elements: Terms, isFirstLevel?: boolean) {
    const firstLevel = isFirstLevel !== undefined ? isFirstLevel : true;
    itemModel = document.querySelector('#mt-item-model');

    const itemsFragment = document.createDocumentFragment();

    let title: Text = undefined;
    let descriptionFrag = firstLevel ? undefined : document.createDocumentFragment();
    let isSection = firstLevel ? false : true;

    for (const el of elements.items) {

        if (el.type === Type.intro) {
            const div = document.createElement('div');
            div.innerHTML = el.text;
            addIntro(div);
        }
        else if (el.type === Type.section) {
            if (title !== undefined) // new section
                addItem(itemsFragment, title, descriptionFrag);


            descriptionFrag = document.createDocumentFragment();
            // sectionDiv.classList.add('mt-section');
            title = newSection(el);
            isSection = true;
        }
        else if (el.type === Type.subSection || el.type === Type.alinea) {
            // if (title === undefined)  

            let newEl = undefined;

            if (el.type === Type.subSection) {
                newEl = newSubSection(el);
            } else {
                newEl = newAlinea(el);
                newEl.classList.add('mt-letter-subsection');
            }

            newEl.classList.add('mt-subsection', 'mt-section');

            if (!isSection) { // it means no section in doc
                if (title !== undefined) { // new section
                    addItem(itemsFragment, title, descriptionFrag);
                    title = undefined;
                }

                const t = (el as SubSection).title || (el as Alinea).letter + '';

                if (t.length > 4) {
                    let titleText = `${(el as SubSection).nb !== undefined ? (el as SubSection).nb : ''} ${t}`;
                    titleText = titleText.trim().replace(/\.$/, '');

                    title = document.createTextNode(titleText);
                    descriptionFrag = document.createDocumentFragment();
                    descriptionFrag.appendChild(newEl);
                }
            } else {
                descriptionFrag.appendChild(newEl);
            }

        }
        else if (el.type === Type.tag) {
            /* const tag = document.createElement(el.tagName);
            tag.appendChild(createList(el, false));

            tag.classList.add('mt-tagitem', 'mt-section'); */
            const div = document.createElement('div');
            div.classList.add('mt-tagitem', 'mt-section');
            div.innerHTML = el.text;

            descriptionFrag.appendChild(div);
        }
        else {
            const div = document.createElement('div');
            div.innerHTML = el.text;

            div.classList.add('mt-normal', 'mt-section');
            if (descriptionFrag)
                descriptionFrag.appendChild(div);
        }
    }

    if (itemsFragment.childNodes.length > 0) { // last one
        if (title)
            addItem(itemsFragment, title, descriptionFrag);
        else {
            // normal text left
            const lastItem = itemsFragment.lastElementChild;
            lastItem.querySelector('#mt-item-description').appendChild(descriptionFrag);
        }

    }


    if (firstLevel) {
        insertItems(itemsFragment);
    } else
        return descriptionFrag;
    // itemModel.parentNode.removeChild(itemModel);
}
