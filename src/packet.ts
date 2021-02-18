export class Packet {
    public name: string
    public data: any
    public id: string
    
    constructor(name: string, data: any = {}, id: string = "") {
        this.name = name
        this.data = data
        this.id = id == "" ? Packet.createId() : id
    }

    public serialize(): string {
        return JSON.stringify(this)
    }

    public static deserialize(data: string): Packet {
        return JSON.parse(data)
    }

    public static createId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}