class Util{

    static timestamp(){
        let date = new Date()
        let timestamp = date.getTime()
        return Math.floor( timestamp / 1000 )
    }
    
}