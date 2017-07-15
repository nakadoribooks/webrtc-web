let App = function(){
    this.init()
}

App.prototype = {

    offered: false

    , init: function(){
        
        // wamp
        this.wamp = new Wamp({
            onReceiveAnswer: (sdp) => {
                if (!this.offered) { return; }

                this.webrtc.receiveAnswer(sdp)
            }
            , onReceiveOffer: (sdp) => {
                if (this.offered) { return; }

                this.webrtc.receiveOffer(sdp, (answerSdp)=>{
                    this.wamp.publishAnswer(answerSdp)
                })
            }
            , onReceiveCandidate: (candidate) => {
                if(this.offered){ return; }

                this.webrtc.receiveCandidate(candidate)
            }
        })

        // webrtc
        this.webrtc = new Webrtc({
            onIceCandidate: (candidate) => {
                this.wamp.publishCandidate(candidate)
            }
            ,onLocalStream: (stream)=>{
                let localVideo = document.querySelector("#loacalVideo")
                localVideo.src = window.URL.createObjectURL(stream);
                localVideo.play()
            }
            ,onAddedStream: (stream) => {
                let remoteVideo = document.querySelector("#remoteVideo")
                remoteVideo.src = window.URL.createObjectURL(stream);
                remoteVideo.play()
            }
        })

        // event
        this.registerDomEvent()

        // connet
        this.wamp.connect()
    },

    registerDomEvent: function(){
        document.querySelector("#offerButton").addEventListener("click", (event)=>{
            this.offered = true
            this.webrtc.createOffer((descriptin)=>{
                this.wamp.publishOffer(descriptin)
            })
        }, false);
    }
}

window.onload = function(){
    let app = new App()
}