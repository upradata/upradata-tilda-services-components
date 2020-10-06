type CustomEventHandler<T> = (evt: CustomEvent<T>) => void;

interface Document {
    addEventListener<DataT>(type: string, listener: /* EventListenerOrEventListenerObject | */ CustomEventHandler<DataT>, options?: boolean | AddEventListenerOptions): void;
}
