export class Api {
    url: string;
    domain: string;
    devPort?: number;

    constructor(api: Api) {
        this.url = api.url.replace(/^\//, '');
        this.domain = api.domain.replace(/\/$/, '');
        this.devPort = api.devPort || 8080;
    }
}
