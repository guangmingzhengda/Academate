<template>
    <div class="references">
        <div v-if="referenceeList.length == 0">
            本文无引证文献~
        </div>
        <ul v-if="referenceeList.length > 0">
            <li v-for="(paper, index) in referenceeList" :key="paper.id">
                [{{ index + 1 }}] <a href="xxx" @click.prevent="navigateTo(paper.id)" class="paper-link">
                {{ modifyTitle(paper.name) }}
            </a>
                <br>
                <span v-for="(author, index) in paper.authorNameList">
                    {{ author }}{{ index < paper.authorNameList.length - 1 ? ', ' : '' }}
                </span>
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
export default {
    name: "citing",
    props: {
        referenceeList: [
            {

            }
        ]
    },
    methods: {
        navigateTo(id) {
            window.open("/achievement-detail/"+id,'_self');
        }
    },
    setup() {
        function modifyTitle(s) {
            return s.replace(/[</>]/g, "").slice(0, 200);
        }
        return {
            modifyTitle,
        }
    }
}
</script>

<style scoped>
.references {
    margin-top: 20px;
    margin-left: 20px;
}

.references h2 {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
    font-size: 1.5rem;
}

.references ul {
    list-style: none;
    padding: 0;
}

.references li {
    margin-bottom: 10px;
    margin-left: 20px;
    font-size: 14px;
    line-height: 1.5;
}

.references li::before {
    content: "\2022";
    position: absolute;
    margin-left: -20px;
}

.references a {
    color: #007bff;
    text-decoration: none;
}

.references a:hover {
    text-decoration: underline;
}

@media (max-width: 768px) {
    .references h2 {
        font-size: 1.2rem;
    }

    .references li {
        margin-left: 10px;
    }
}

.paper-link {
    color: #007bff;
    text-decoration: none;
    transition: color 0.3s ease;
}

.paper-link:hover {
    color: #0056b3;
    text-decoration: underline;
}

</style>
