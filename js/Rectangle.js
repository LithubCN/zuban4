class Rectangle {
    constructor(width, height, id = null) {
        this.width = width;
        this.height = height;
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.color = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    }

    clone() {
        const rect = new Rectangle(this.width, this.height, this.id);
        rect.x = this.x;
        rect.y = this.y;
        rect.color = this.color;
        return rect;
    }
} 
