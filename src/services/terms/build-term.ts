import { Term, Type, SubSection, Section, Alinea, Text as TextItem, Tag, Footer } from '@upradata/tilda-tools/lib/terms/terms.types';
import { Components as MtStencil } from '@upradata/stencil-components';


function newSection(section: Section): HTMLMtBlogSectionElement {
    const sectionEl: HTMLMtBlogSectionElement = document.createElement('mt-blog-section');
    sectionEl.content = section.title;

    return sectionEl;
}

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
    const div = document.createElement('div');
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


export function buildTerm(term: Term): HTMLMtTildaTermElement {
    const mtTermEl = document.createElement('mt-tilda-term');

    mtTermEl.header = term.header;
    mtTermEl.intro = term.intro;

    let item: MtStencil.MtTildaAccordeonItem = undefined;
    const createItem = (): MtStencil.MtTildaAccordeonItem => { const item = { header: '', content: '' }; mtTermEl.addItem(item); return item; };


    for (const section of term.sections) {
        item = createItem();
        item.header = section.title;

        for (const el of section.items) {
            if (el.type === Type.subSection) {
                item.content += newSubSection(el).outerHTML;
            } else if (el.type === Type.alinea) {
                item.content += newAlinea(el).outerHTML;
            }
            else if (el.type === Type.tag) {
                item.content += newTag(el).outerHTML;
            }
            else if (el.type === Type.text) {
                item.content += newText(el).outerHTML;
            }
            else if (el.type === Type.footer) {
                item.content += newFooter(el).outerHTML;
            } else {
                console.warn(`buildTerm received an unknown type: "${el.type}"`);
            }
        }
    }


    return mtTermEl;
}
