export class Api {
    url: string;
    domain: string;

    constructor(api: Api) {
        this.url = api.url.replace(/^\//, '');
        this.domain = api.domain.replace(/\/$/, '');
    }
}
