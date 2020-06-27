import { Term, Type, SubSection, Alinea, Text as TextItem, Tag, Footer } from '@upradata/tilda-tools/lib/src/terms/terms.types';
import { Components as MtStencil } from '@upradata/stencil-components';
import { Function0 } from '@upradata/util';


function newSubSection({ nb, title, description }: SubSection): HTMLMtBlogSubsectionElement {
    const subsectionEl: HTMLMtBlogSubsectionElement = document.createElement('mt-blog-subsection');

    subsectionEl.nb = nb;
    subsectionEl.header = title;
    subsectionEl.description = description;

    return subsectionEl;
}


function newAlinea({ letter, description }: Alinea): HTMLMtBlogAlineaElement {
    const alineaEl: HTMLMtBlogAlineaElement = document.createElement('mt-blog-alinea');

    alineaEl.letter = letter;
    alineaEl.description = description;

    return alineaEl;
}

function newText({ text }: TextItem) {
    const div = document.createElement('div');
    div.innerHTML = text;

    div.classList.add('mt-normal', 'mt-blog-p');

    return div;
}

function newTag({ tagName, text }: Tag) {
    const div = document.createElement('div'); // I decided to let the tag inside the text
    div.innerHTML = text;
    div.classList.add('mt-tag', 'mt-blog-p');

    return div;
}

function newFooter({ html }: Footer) {
    const div = document.createElement('div');
    div.slot = 'footer';

    div.innerHTML = html;
    div.classList.add('mt-blog-p');

    return div;
}


export function buildTerm(term: Term): { termElement: HTMLMtTildaTermElement; init: Function0<Promise<void>>; } {
    const mtTermEl = document.createElement('mt-tilda-term');

    const init = async () => {
        await Promise.all([
            'mt-tilda-term',
            'mt-tilda-accordeon-item',
            'mt-blog-subsection',
            'mt-blog-alinea',
        ].map(tag => customElements.whenDefined(tag)));

        mtTermEl.header = term.header;
        mtTermEl.intro = term.intro;


        const createItem = (header: string) => {
            const accordeonItem = document.createElement('mt-tilda-accordeon-item');
            accordeonItem.header = header;
            accordeonItem.slot = 'item';

            return {
                header: '',
                content: '',
                addContent: (el: HTMLElement) => accordeonItem.appendChild(el),
                updateAccordeon: () => mtTermEl.appendChild(accordeonItem)
            };
        };

        // we cannot do it dynamically because we use innerHTML and the custom element will not be created and rendered
        // const addItem = (item: MtStencil.MtTildaAccordeonItem) => mtTermEl.addItem(item);

        for (const section of term.sections) {
            const item = createItem(section.title);

            for (const el of section.items) {
                switch (el.type) {
                    case Type.subSection: item.addContent(newSubSection(el)); break;
                    case Type.alinea: item.addContent(newAlinea(el)); break;
                    case Type.tag: item.addContent(newTag(el)); break;
                    case Type.text: item.addContent(newText(el)); break;
                    case Type.footer: item.addContent(newFooter(el)); break;
                    default: console.warn(`buildTerm received an unknown type: "${el.type}"`);
                }
            }

            item.updateAccordeon();
        }


        /*  return new Promise<void>((res) => {
             setTimeout(() => mtTermEl.init(true).then(() => res()), 2000); // We have to wait stencil render => 1 tick + next tick
         }); */
    };

    return { termElement: mtTermEl, init };
}
