export abstract class BinarySearchTree<T> {
    parent: BinarySearchTree<T> | undefined;
    left?: BinarySearchTree<T>;
    right?: BinarySearchTree<T>;
    value: T;

    constructor(root: BinarySearchTree<T> | undefined, value: T) {
        this.parent = root;
        this.value = value;
    }

    // If the value is less than the current node, return true
    abstract compare(value: T): boolean;

    insert(value: T): void {
        if (this.compare(value)) {
            if (!this.left) {
                this.left = this.createNode(value);
            } else {
                this.left.insert(value);
            }
        } else {
            if (!this.right) {
                this.right = this.createNode(value);
            } else {
                this.right.insert(value);
            }
        }
    }

    // Returns the node with the smallest key greater than or equal to the given value
    getCeiledKey(value: T): T | undefined {
        if (this.compare(value)) {
            if (!this.left) {
                return this.value;
            }
            return this.left.getCeiledKey(value);
        } else {
            if (!this.right) {
                return undefined;
            }
            return this.right.getCeiledKey(value);
        }
    }

    protected abstract createNode(value: T): BinarySearchTree<T>;
}

export abstract class LinkedListNode<T> {
    parent: LinkedListNode<T> | undefined;
    next?: LinkedListNode<T>;
    value: T;

    constructor(root: LinkedListNode<T> | undefined, value: T) {
        this.parent = root;
        this.value = value;
    }

    // If the value is less than the current node, return true
    abstract compare(value: T): boolean;

    insert(value: T): void {
        if (!this.next) {
            this.next = this.createNode(value);
        } else {
            this.next.insert(value);
        }
    }

    protected abstract createNode(value: T): LinkedListNode<T>;

    /**
     * Returns the closest bound key for the supplied value.
     * For a floor query (floor = true), returns the greatest element ≤ value.
     * For a ceiling query (floor = false), returns the smallest element ≥ value.
     */
    getBoundKey(value: T, floor = true): T | undefined {
        if (this.compare(value)) {
            if (floor) {
                return this.value;
            }
            if (!this.next) {
                return undefined;
            }
            return this.next.getBoundKey(value, floor);
        } else {
            if (!this.parent) {
                return undefined;
            }
            return this.parent.getBoundKey(value, floor);
        }
    }
}
export abstract class ArrayListNode<T> {
    elements: T[] = [];

    constructor(elements: T[]) {
        for (const element of elements) {
            this.insert(element);
        }
    }

    // Should return true if value1 is considered less than value2.
    abstract compare(value1: T, value2: T | number): boolean;

    // Insert in the array in order using binary search for index lookup.
    insert(value: T): void {
        const index = this.findInsertionIndex(value);
        this.elements.splice(index, 0, value);
    }

    // Binary search to find the correct insertion index.
    private findInsertionIndex(value: T): number {
        let left = 0;
        let right = this.elements.length;
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (this.compare(this.elements[mid], value)) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        return left;
    }

    // Binary search for the bound key.
    // For floor queries (floor = true), returns the greatest element ≤ value.
    // For ceiling queries (floor = false), returns the smallest element ≥ value.
    getBoundKey(value: T | number, floor = true): T | undefined {
        let left = 0;
        let right = this.elements.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (this.compare(this.elements[mid], value)) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        if (floor) {
            return right >= 0 ? this.elements[right] : undefined;
        } else {
            return left < this.elements.length ? this.elements[left] : undefined;
        }
    }
}
