import webpack from 'webpack';

export interface MultiStats {
    stats: webpack.Stats[];
    readonly hash: string;
    hasErrors(): boolean;
    hasWarnings(): boolean;
    toJson(
        options?: any
    ): {
        children: any[];
        version: any;
        hash: string;
        errors: any[];
        warnings: any[];
        errorsCount: number;
        warningsCount: number;
    };
    toString(options?: any): string;
}
