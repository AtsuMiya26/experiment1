const jsPsych = initJsPsych({
    on_finish: function() {
        jsPsych.data.displayData();
    }
});

let qNumber = 1;

const mainRandomTrial = (passages, images, hypernymy, allowToSkipPassage=true) => {
    const res = {
        timeline: [
            {
                type: jsPsychPreload,
                images: images
            },
            {
                type: jsPsychHtmlButtonResponse,
                stimulus: () => `
                    <p>Q${qNumber++}.</p>`, // インクリメントしつつ、もとの値を返す
                choices: [''],
                trial_duration: 2000,
                css_classes: 'q-number',
            },
            {
                sample: {
                    type: 'without-replacement',
                    size: 1
                },
                timeline: [
                    {
                        type: jsPsychHtmlButtonResponse,
                        stimulus: () => {
                            if (jsPsych.timelineVariable('passage')) {
                                return `
                                    <p>次の文章をお読みください。</p>
                                    <p class="passage-text">${jsPsych.timelineVariable('passage')}</p>`;
                            } else {
                                return '';
                            }
                        },
                        choices: ['次へ'],
                        trial_duration: () => jsPsych.timelineVariable('passage') ? null : 0,
                        css_classes: 'passage'
                    }
                ],
                timeline_variables: (allowToSkipPassage ? [null, ...passages] : passages).map(p => {
                    return {
                        passage: p
                    }
                })
            },
            {
                type: jsPsychHtmlButtonResponse,
                stimulus: `
                    <p>次に画像をお見せします。「${hypernymy}」を選んでください。</p>`,
                choices: ['次へ']
            },
            {
                timeline: [
                    {
                        type: jsPsychImageButtonResponse,
                        stimulus: jsPsych.timelineVariable('img'),
                        choices: [`「${hypernymy}」だ`, `「${hypernymy}」でない`],
                        prompt: "",
                        css_classes: 'is-this-img-sth'
                    }
                ],
                timeline_variables: images.map(i => {
                    return {
                        img: i
                    }
                }),
                randomize_order: true,
            }
        ]
    };
    return res;
};

const timeline = [
    // 初期画面
    {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <p>実験にご協力いただきありがとうございます。</p>
            <p>ボタンを押して先へお進みください。</p>`,
        choices: ['先へ進む'],
        css_classes: 'welcome'
    },
    // 諸注意
    {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <p>実験に際して、以下のことに同意いただける場合は、ボタンを押して先にお進みください。</p>
            <ul>
                <li>本実験は、神奈川県立横浜翠嵐高等学校 二年 宮下敦行 が行っております。</li>
                <li>実験を通して得たデータは、研究成果の一部として発表される可能性があります。</li>
                <li>実験に際して、個人情報は収集しません。</li>
            </ul>`,
        choices: ['同意する'],
        css_classes: 'terms'
    },
    // 母語
    {
        type: jsPsychSurveyMultiChoice,
        questions: [
            {
                prompt: "母語は…",
                options: ['日本語', 'それ以外'],
                name: 'mother-tongue',
                required: true
            }
        ],
        button_label: '次へ',
        css_classes: 'mother-tongue'
    },
    {
        conditional_function: () => {
            const prevRes = jsPsych.data.get().last(1).values()[0];
            return prevRes.response['mother-tongue'] != '日本語';
        },
        timeline: [
            {
                type: jsPsychSurveyText,
                questions: [
                    {
                        prompt: '母語は…',
                        placeholder: '○○語',
                        name: 'mother-tongue',
                        required: true
                    }
                ],
                button_label: '次へ'
            }
        ]
    },
    // 参加回数
    {
        type: jsPsychSurveyMultiChoice,
        questions: [
            {
                prompt: "この実験に参加するのは…",
                options: ['初めて', '2回目以上'],
                name: 'times-of-participation',
                required: true
            }
        ],
        button_label: '次へ',
        css_classes: 'times-of-participation'
    },
    {
        conditional_function: () => {
            const prevRes = jsPsych.data.get().last(1).values()[0];
            return prevRes.response['times-of-participation'] != '初めて';
        },
        timeline: [
            {
                type: jsPsychSurveyText,
                questions: [
                    {
                        prompt: 'この実験に参加するのは…',
                        placeholder: '半角数字',
                        name: 'times-of-participation',
                        required: true
                    }
                ],
                button_label: '次へ',
                on_load: () => {
                    document.querySelector('.jspsych-content.times-of-participation-multiple input').type = 'number';
                },
                css_classes: 'times-of-participation-multiple'
            }
        ]
    },
    // 実験開始画面
    {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <p>ボタンを押すと実験を開始します。</p>`,
        choices: ['開始'],
        css_classes: 'set-out'
    },
    ...(
        () => {
            // 要素 2 つの配列にのみ有用
            // 参照: https://ja.javascript.info/task/shuffle
            const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

            const group1 = shuffle([
                // マーカーペン
                mainRandomTrial(
                    [
                        '「来週の授業には、マーカーを持参してください。」',
                        '「来週の授業には、マーカーペンを持参してください。」'
                    ],
                    [
                        './img/red-ballpoint.png',
                        './img/marker.png',
                        './img/mechanical.png',
                        './img/pencil.png',
                        './img/ruler.png'
                    ],
                    'ペン'
                ),
                // マジックペン
                mainRandomTrial(
                    [
                        '「書き込む際は油性マジックを使用してください。」',
                        '「書き込む際は油性のマジックペンを使用してください。」'
                    ],
                    [
                        // Now Here
                    ],
                    'ペン'
                ),
            ]);
            const group2 = shuffle([
                // ダミーテスト1
                mainRandomTrial(
                    [
                        '「あの店のニンジンは安いですよ。」',
                        '「あの店のレンコンは安いですよ。」',
                        '「あの店のチーズは安いですよ。」',
                        '「あの店のお米は安いですよ。」',
                        '「あの店のお茶は安いですよ。」',
                    ],
                    [
                        './img/carrot.png',
                        './img/lotus-root.png',
                        './img/cheese.png',
                        './img/rice.png',
                        './img/tea.png'
                    ],
                    '野菜',
                    false
                ),
                // クロスワードパズル
                mainRandomTrial(
                    [
                        '「休日には、クロスワードをよくやっています。」',
                        '「休日には、クロスワードパズルをよくやっています。」'
                    ],
                    [
                        './img/jigsaw-puzzle.png',
                        './img/crossword.png',
                        './img/maze.png',
                        './img/shogi.png',
                        './img/blocks.png'
                    ],
                    'パズル'
                )
            ]);
            return [group1[0], ...group2, group1[1]];
        }
    )(),
];
jsPsych.run(timeline);
