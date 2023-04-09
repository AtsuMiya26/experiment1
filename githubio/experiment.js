const shuffle = arr => {
    // 参照: https://ja.javascript.info/task/shuffle
    res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
};

const randomElement = arr => {
    return arr[Math.floor(Math.random() * arr.length)];
};

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
                images: images,
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
    // 直感で答えてください
    {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
        <p>実験では、いくつか質問をします。なるべく直感で答えてください。</p>`,
        choices: ['わかった'],
    },
    // 実験開始画面
    {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
        <p>ボタンを押すと実験を開始します。</p>`,
        choices: ['開始'],
        css_classes: 'set-out'
    },
    // メイン
    ...(
        () => {
            imgs_ballpoint = shuffle([
                './img/ballpoint.jpg',
                './img/ballpoint2.jpg'
            ]);
            imgs_mechanical = shuffle([
                './img/mechanical.jpg',
                './img/mechanical2.jpg'
            ]);
            imgs_pencil = shuffle([
                './img/pencil.jpg',
                './img/pencil2.jpg'
            ]);
            imgs_ruler = shuffle([
                './img/ruler.jpg',
                './img/ruler2.jpg'
            ]);
            
            const group1 = shuffle([
                // マーカーペン
                mainRandomTrial(
                    [
                        '「来週の授業には、マーカーを持参してください。」',
                        '「来週の授業には、マーカーペンを持参してください。」'
                    ],
                    [
                        './img/marker.jpg',
                        imgs_ballpoint[0],
                        imgs_mechanical[0],
                        imgs_pencil[0],
                        imgs_ruler[0]
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
                        './img/magic-pen.jpg',
                        imgs_ballpoint[1],
                        imgs_mechanical[1],
                        imgs_pencil[1],
                        imgs_ruler[1]
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
    // 呼び方
    ...(
        shuffle([
            {
                img: './img/marker.jpg',
                options: [
                    'マーカー',
                    'ラインマーカー',
                    'マーカーペン',
                    '蛍光ペン',
                ]
            },
            {
                img: './img/magic-pen.jpg',
                options: [
                    'マジック',
                    '油性マジック',
                    'マジックペン',
                    '油性ペン',
                ]
            },
            {
                img: './img/crossword.png',
                options: [
                    'クロスワード',
                    'クロスワードパズル',
                ]
            },
        ]).map(e => {
            options = [
                ...(shuffle(e.options).map(o => '「' + o + '」')),
                'その他',
                `えっ、それ${randomElement(e.options)}だったんですか？！`
            ];
            return {
                timeline: [
                    {
                        type: jsPsychSurveyMultiChoice,
                        questions: [
                            {
                                prompt: `
                                    <img src="${e.img}"/>
                                    いつも、これを何と呼んでいますか？`,
                                options: options,
                                required: true
                            }
                        ],
                        button_label: '次へ',
                        css_classes: 'what-do-you-call-this'
                    },
                    {
                        conditional_function: () => {
                            const prevRes = jsPsych.data.get().last(1).values()[0];
                            return prevRes.response['Q0'] == 'その他';
                        },
                        timeline: [
                            {
                                type: jsPsychSurveyText,
                                questions: [
                                    {
                                        prompt: `
                                            <img src="${e.img}"/>
                                            いつも、これを何と呼んでいますか？`,
                                        name: 'what-do-you-call-this',
                                        required: true
                                    }
                                ],
                                button_label: '次へ',
                                css_classes: 'what-do-you-call-this-others'
                            }
                        ]
                    }
                ]
            }
        })
    ),
];
jsPsych.run(timeline);
