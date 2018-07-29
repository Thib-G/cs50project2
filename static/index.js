Vue.component('cs50-app-component', {
    data() {
        return {
            votes: {
                yes: 0,
                no: 0,
                maybe: 0,
            },
            socket: io.connect(location.protocol + '//' + document.domain + ':' + location.port),
        };
    },
    created() {
        this.socket.on('vote totals', data => {
            this.votes = data;
        });
    },
    mounted() {
        this.socket.emit('init votes');
    },
    methods: {
        addVote(key) {
            this.socket.emit('submit vote', { selection: key });
        },
    },
    template: `
        <div>
            <ul class="list-group">
                <li v-for="(v, k) in votes" :key="k" class="list-group-item">
                    {{ k }}: {{ v }}
                </li>
            </ul>
            <br />
            <div class="btn-group">
                </template>
                <template v-for="(v, k) in votes">
                    <btn-vote-component :key="k" :vote="k" @onvote="addVote">
                    </btn-vote-component>
                </template>
            </div>
        </div>
    `,
});

Vue.component('btn-vote-component', {
    props: ['vote'],
    methods: {
        sendVote() {
            this.$emit('onvote', this.vote);
        },
    },
    template: `
        <button class="btn btn-primary" @click="sendVote">
            {{ vote }}
        </button>
    `,
})

const app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue!',
    },
});
