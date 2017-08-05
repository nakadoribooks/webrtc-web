let RemoteStream = {
    props: ['src'],
    template:  `<div class="box videoBox">
                    <video class="video" v-bind:src="src" />
                 </div> `,
    mounted: function(){
        let video = this.$el.querySelector("video")
        video.oncanplay = ()=>{
            video.play()
        }
    }
}

let MyStream = {
    props: ['src'],
    template: `<div class="box videoBox">
                    <video class="video" v-bind:src="src" />
                </div>`,

    mounted: function(){
        let video = this.$el.querySelector("video")
        video.oncanplay = ()=>{
            video.play()
        }
    }
}

let app = new Vue({
    el: '#app',
    components: {
        'remote-stream': RemoteStream
        , 'my-stream': MyStream
    },

    data:{
        myStream : {"src": ""}
        , remoteStreamList: []
    },

    mounted: function(){

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
                this.myStream.src = window.URL.createObjectURL(stream);
            }
            ,onAddedStream: (stream) => {
                stream.src = window.URL.createObjectURL(stream);
                this.remoteStreamList.push(stream)
            }
        })

        // event
        this.registerDomEvent()

        // connet
        this.wamp.connect()
    },

    methods: {
        registerDomEvent: function(){
            document.querySelector("#offerButton").addEventListener("click", (event)=>{
                this.offered = true
                this.webrtc.createOffer((descriptin)=>{
                    this.wamp.publishOffer(descriptin)
                })
            }, false);
        }
    }
})
