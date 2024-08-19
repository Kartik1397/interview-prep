const PromiseState = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected'
};

const isThenable = maybePromise => maybePromise && typeof maybePromise.then === 'function';

class CPromise {
    constructor(executor) {
        this._state = PromiseState.PENDING;

        this._value = undefined;
        this._reason = undefined;

        this._thenQueue = [];
        this._finallyQueue = [];

        if (typeof executor === 'function') {
            try {
                executor(
                    this._onFulfilled.bind(this),
                    this._onRejected.bind(this)
                );
            } catch (ex) {
                this._onRejected(ex);
            }
        }
    }

    then(fulfilledFn, catchFn) {
        const controlledPromise = new CPromise();
        this._thenQueue.push([controlledPromise, fulfilledFn, catchFn]);

        if (this._state === PromiseState.FULFILLED) {
            this._propagateFulfilled();
        } else if (this._state === PromiseState.REJECTED) {
            this._propagateRejected();
        }

        return controlledPromise;
    }

    catch(catchFn) {
        return this.then(undefined, catchFn);
    }

    finally(sideEffectFn) {
        if (this._state !== PromiseState.PENDING) {
            sideEffectFn();

            return this._state === PromiseState.FULFILLED
            ? CPromise.resolve(this._value)
            : CPromise.reject(this._reason)
        }

        const controlledPromise = new CPromise()
        this._finallyQueue.push([controlledPromise, sideEffectFn]);

        return controlledPromise;
    }

    _propagateFulfilled() {
        this._thenQueue.forEach(([controlledPromise, fulfilledFn]) => {
            if (typeof fulfilledFn === 'function') {
                const valueOrPromise = fulfilledFn(this._value);
                if (isThenable(valueOrPromise)) {
                    valueOrPromise.then(
                        value => controlledPromise._onFulfilled(value),
                        reason => controlledPromise._onRejected(reason)
                    );
                } else {
                    controlledPromise._onFulfilled(valueOrPromise);
                }
            } else {
                return controlledPromise._onFulfilled(this._value);
            }
        });

        this._finallyQueue.forEach(([controlledPromise, sideEffectFn]) => {
            if (typeof sideEffectFn === 'function') {
                sideEffectFn();
            }
            controlledPromise._onFulfilled(this._value);
        });

        this._thenQueue = [];
        this._finallyQueue = [];
    }

    _propagateRejected() {
        this._thenQueue.forEach(([controlledPromise, _, catchFn]) => {
            if (typeof catchFn === 'function') {
                const valueOrPromise = catchFn(this._reason);

                if (isThenable(valueOrPromise)) {
                    valueOrPromise.then(
                        value => controlledPromise._onFulfilled(value),
                        reason => controlledPromise._onRejected(reason),
                    );
                } else {
                    controlledPromise._onFulfilled(valueOrPromise);
                }
            } else {
                return controlledPromise._onRejected(this._value);
            }
        });

        this._finallyQueue.forEach(([controlledPromise, sideEffectFn]) => {
            if (typeof sideEffectFn === 'function') {
                sideEffectFn();
            }
            controlledPromise._onRejected(this._reason);
        });

        this._thenQueue = [];
        this._finallyQueue = [];
    }

    _onFulfilled(value) {
        process.nextTick(() => {
            if (this._state === PromiseState.PENDING) {
                this._state = PromiseState.FULFILLED;
                this._value = value;
                this._propagateFulfilled();
            }
        })
    }

    _onRejected(reason) {
        process.nextTick(() => {
            if (this._state === PromiseState.PENDING) {
                this._state = PromiseState.REJECTED;
                this._reason = reason;
                this._propagateRejected();
            }
        })
    }
}

function main() {
//    const p = new CPromise((resolve, reject) => {
//        resolve()
//        reject()
//    });
//
//    p
//        .then(() => console.log('then'))
//        .then(() => console.log('then agian'))
//        .catch(() => console.log('catch'));
//
//    p.then(() => console.log('multiple then'));
//    p.then(() => console.log('multiple then'));
//    p.then(() => console.log('multiple then'));
//
//    p.catch(() => console.log('multiple catch 1'));
//    p.catch(() => console.log('multiple catch 2'));
//    p.catch(() => console.log('multiple catch 3'));
//
//    p.finally(() => console.log('done'));

//    console.log('start');
//    const p = new CPromise((resolve, reject) => {
//        console.log(1);
//        resolve(2);
//    });
//
//    p.then(res => {
//        console.log(res);
//    });
//
//    console.log('end');

    console.log('start');

    setTimeout(() => {
        console.log('setTimeout');
    });

    const p = new CPromise((resolve, reject) => {
        console.log(1);
        resolve(2);
    });

    p.then(res => {
        console.log(res);
    });

    console.log('end');
}
main();
