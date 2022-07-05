#!/usr/bin/env node
const [, , ...args] = process.argv;
const fs = require("fs");
const path = require("path");
const colors = require("ansi-colors")
const { exec } = require("child_process");
const amazon = require("./scripts/amazon")
const wp = require("./scripts/wp")

const SEED_MODE = args.includes("--seed")
const SKIP_QUESTIONS = args.includes("--skip")
const DEBUG_ENABLED = args.includes("--debug")

const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
});
if (DEBUG_ENABLED) {
    console.log(process.env.WP_USER)
}
const seedQuestions = {
    wpUrl: {
        question: "Enter the WordPress URL",
        answer: process.env.WP_URL || "http://localhost:8000",
        required: false,
    },
    wpUser: {
        question: "Enter a WordPress user to use with the JSON API",
        answer: process.env.WP_USER || "Dolly",
        required: false,
    },
    wpPass: {
        question: "Enter the WordPress user password",
        answer: process.env.WP_PASS || "password123",
        required: false,
    },
    wpStatus: {
        question: "Enter the default post status",
        answer: process.env.WP_STATUS || "publish",
        required: false,
    },
    amazonAccessKey: {
        question: "Enter the Amazon Access Key",
        answer: process.env.AMAZON_ACCESS_KEY || "",
        required: false,
    },
    amazonSecretKey: {
        question: "Enter the Amazon Secret Key",
        answer: process.env.AMAZON_SECRET_KEY || "",
        required: false,
    },
    amazonKeywords: {
        question: "Enter keywords for Amazon products",
        answer: process.env.AMAZON_KEYWORDS || "",
        required: false,
    },
    amazonSearchIndex: {
        question: "Enter Amazon product search index",
        answer: process.env.AMAZON_SEARCH_INDEX || "",
        required: false,
    },
    amazonPartnerTag: {
        question: "Enter Amazon partner tag",
        answer: process.env.AMAZON_PARTNER_TAG || "",
        required: false,
    },
    amazonHost: {
        question: "Enter the Amazon Host Base URL",
        answer: process.env.AMAZON_HOST || "webservices.amazon.com",
        required: false
    },
    amazonRegion: {
        question: "Enter the Amazon Host Region",
        answer: process.env.AMAZON_REGION || "us-east",
        required: false
    },
}

const questions = SEED_MODE ? seedQuestions : {
    name: {
        question: "Project Name",
        answer: "project-name-goes-here",
        required: false,
    },
    repoUrl: {
        question: "Git repo URL for the project",
        answer: "",
        required: false,
    },
    secretKey: {
        question: "Enter the license key",
        answer: "0IJ2LJDPOIJWOIEJF-DEMO",
        required: false,
    },
    hostUrl: {
        question: "Enter the host url",
        answer: "",
        required: false
    },
    gaID: {
        question: "Enter a Google Analytics ID",
        answer: "",
        required: false
    },
};

const questionObjectKeys = Object.keys(SEED_MODE ? seedQuestions : questions);

const loadingIndicator = (message) => {
    let step = 1;
    console.log(message)
    return setInterval(() => {
        process.stdout.clearLine()
        process.stdout.cursorTo(0)

        switch (step) {
            case (1):
                process.stdout.write(colors.magenta('°°°'))
                break;
            case (2):
                process.stdout.write(colors.magenta('•°°'))
                break;
            case (3):
                process.stdout.write(colors.magenta('°•°'))

                break;
            default:
                process.stdout.write(colors.magenta('°°•'))
                break;
        }
        step = step === 4 ? 1 : step + 1;
    }, 200)
}


const projectPath = () => path.join(process.cwd(), questions.name.answer);
const projectClientPath = () => path.join(projectPath(), 'client');
const projectServerPath = () => path.join(projectPath(), 'server');

const askQuestion = () => {
    return new Promise((resolve, reject) => {
        if (SKIP_QUESTIONS) resolve()
        const key = questionObjectKeys.shift();
        if (key) {
            const questionObject = questions[key];
            readline.question(`${questionObject.question}: `, (answer) => {
                const finalAnswer = (answer || questions[key].answer)
                questions[key].answer =
                    key === "name"
                        ? finalAnswer.toLocaleLowerCase().replace(/ /g, "-")
                        : finalAnswer;
                askQuestion().then(resolve).catch(reject)
            });
        } else resolve();
    });
};

const generateProject = () => {
    return new Promise((resolve, reject) => {
        fs.mkdir(projectPath(), (err) => {
            if (err) return reject(err);
            fs.mkdir(projectClientPath(), (err) => {
                if (err) return reject(err);
                fs.mkdir(projectServerPath(), (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    });
};

const stopLoadingIndicator = (loadingInstance, message) => {
    clearInterval(loadingInstance)
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    if (message) console.log(colors.green(message))
}

const downloadWebFE = () => {
    const loadingInstance = loadingIndicator("Downloading the frontend...")
    return new Promise((resolve, reject) => {
        exec(
            `curl -sL https://github.com/by-rojo/iagnmft-nodejs/zipball/main/ | tar zx --strip-components 1 -C ${projectClientPath()}`,
            (error, output) => {
                stopLoadingIndicator(loadingInstance, "Successfully downloaded the frontend!")
                if (error) reject(error);
                else resolve();
            }
        );
    });
};

const installWebFE = () => {
    const loadingInstance = loadingIndicator("Installing the frontend...")
    return new Promise((resolve, reject) => {
        exec(`cd ${projectClientPath()} && npm i`, (err) => {
            stopLoadingIndicator(loadingInstance, "Successfully installed the frontend!")
            if (err && process.env.NODE_ENV !== "dev") reject(err);
            else resolve();
        });
    })
};

const downloadWordPressBE = () => {
    const loadingInstance = loadingIndicator("Downloading WordPress backend application...")
    return new Promise((resolve, reject) => {
        exec(
            `curl -sL https://github.com/by-rojo/react-ka-ching-wp/zipball/main/ | tar zx --strip-components 1 -C ${projectServerPath()}`,
            (error) => {
                stopLoadingIndicator(loadingInstance, "Successfully downloaded the WordPress backend!")
                if (error) reject(error);
                else resolve();
            }
        );
    });
};

const installWordPressBE = () => {
    const loadingInstance = loadingIndicator("Installing the WordPress BE...")
    return new Promise((resolve, reject) => {
        exec(`cd ${projectServerPath()} && docker compose up -d`, (err) => {
            stopLoadingIndicator(loadingInstance, "Successfully installed the WordPress BE!")
            if (err) reject(err);
            else exec("open http://localhost:8000", resolve);
        });
    })
};

const seedProducts = () => {
    const loadingInstance = loadingIndicator("Installing products from amazon")
    return new Promise((resolve, reject) => {

        const amazonBot = amazon({
            AMAZON_ACCESS_KEY: seedQuestions.amazonAccessKey.answer,
            AMAZON_KEYWORDS: seedQuestions.amazonKeywords.answer,
            AMAZON_PARTNER_TAG: seedQuestions.amazonPartnerTag.answer,
            AMAZON_SEARCH_INDEX: seedQuestions.amazonSearchIndex.answer,
            AMAZON_SECRET_KEY: seedQuestions.amazonSecretKey.answer,
            AMAZON_HOST: seedQuestions.amazonHost.answer,
            AMAZON_REGION: seedQuestions.amazonRegion.answer,
        })

        const wpBot = wp({
            WP_URL: seedQuestions.wpUrl.answer,
            WP_USER: seedQuestions.wpUser.answer,
            WP_PASS: seedQuestions.wpPass.answer,
            WP_STATUS: seedQuestions.wpStatus.answer,
        })

        return amazonBot.start().then(wpBot.start).then(() => {
            stopLoadingIndicator(loadingInstance, "Successfully setup products")
            return resolve()
        }).catch((e) => {
            stopLoadingIndicator(loadingInstance)
            return reject(e)
        })
    })
};


const exit = () => {
    readline.close();
};

if (SEED_MODE) {
    askQuestion()
        .then(() => seedProducts())
        .then(exit)
        .catch((err) => {
            console.error(err)
            exit()
        })
}
else {
    askQuestion()
        .then(() => generateProject())
        .then(() => downloadWebFE())
        .then(() => installWebFE())
        .then(() => downloadWordPressBE())
        .then(() => installWordPressBE())
        .then(exit)
        .catch((err) => {
            console.error(err)
            exit()
        })
}