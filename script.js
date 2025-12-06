document.addEventListener('DOMContentLoaded', () => {
    const csvFilePath = 'hintdata.csv';
    const container = document.getElementById('hint-container');

    // CSVファイルを読み込む関数
    async function loadHints() {
        try {
            const response = await fetch(csvFilePath);
            const csvText = await response.text();
            
            // CSVをパースしてオブジェクトの配列に変換
            const hints = parseCSV(csvText);
            
            // ヒントをステップごとにグループ化
            const groupedHints = hints.reduce((acc, hint) => {
                const stepKey = `ステップ ${hint.Step}`;
                if (!acc[stepKey]) {
                    acc[stepKey] = [];
                }
                acc[stepKey].push(hint);
                return acc;
            }, {});

            // HTMLにレンダリング
            renderHints(groupedHints, container);
            
            // イベントリスナーを設定
            setupToggleListeners();

        } catch (error) {
            console.error('ヒントデータの読み込み中にエラーが発生しました:', error);
            container.innerHTML = '<p style="color: red;">ヒントデータを読み込めませんでした。</p>';
        }
    }

    // CSVパースの簡易実装
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        // ヘッダー行をスキップ
        const headers = lines[0].split(',');
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            let obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i].trim();
            });
            return obj;
        });
    }

    // HTMLのレンダリング
    function renderHints(groupedHints, container) {
        for (const stepKey in groupedHints) {
            const stepData = groupedHints[stepKey];
            
            // ステップコンテナの作成
            const stepDiv = document.createElement('div');
            stepDiv.className = 'hint-step';
            
            // ステップタイトル
            const stepTitle = document.createElement('h2');
            stepTitle.textContent = `▶ ${stepKey}`;
            stepDiv.appendChild(stepTitle);

            // 各ヒントの要素を作成
            stepData.forEach(hint => {
                // ヒントのタイトルボタン
                const titleButton = document.createElement('button');
                titleButton.className = 'hint-title';
                titleButton.textContent = hint.Title;
                titleButton.dataset.target = `content-s${hint.Step}-h${hint.HintID}`;
                titleButton.setAttribute('aria-expanded', 'false');
                stepDiv.appendChild(titleButton);

                // ヒントの内容エリア
                const contentDiv = document.createElement('div');
                contentDiv.id = `content-s${hint.Step}-h${hint.HintID}`;
                contentDiv.className = 'hint-content';
                contentDiv.innerHTML = `<p>${hint.Content}</p>`;
                contentDiv.setAttribute('aria-hidden', 'true');
                stepDiv.appendChild(contentDiv);
            });

            container.appendChild(stepDiv);
        }
    }

    // クリックイベントの設定
    function setupToggleListeners() {
        document.querySelectorAll('.hint-title').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                const targetContent = document.getElementById(targetId);

                // トグル処理
                if (targetContent) {
                    const isExpanded = targetContent.classList.contains('active');
                    
                    if (isExpanded) {
                        // 閉じる
                        targetContent.classList.remove('active');
                        e.currentTarget.setAttribute('aria-expanded', 'false');
                        targetContent.setAttribute('aria-hidden', 'true');
                    } else {
                        // 開く
                        // 他の開いているヒントをすべて閉じる（オプション: 1つだけ開くようにする）
                        document.querySelectorAll('.hint-content.active').forEach(openContent => {
                            openContent.classList.remove('active');
                            document.querySelector(`[data-target="${openContent.id}"]`).setAttribute('aria-expanded', 'false');
                            openContent.setAttribute('aria-hidden', 'true');
                        });

                        // 選択したヒントを開く
                        targetContent.classList.add('active');
                        e.currentTarget.setAttribute('aria-expanded', 'true');
                        targetContent.setAttribute('aria-hidden', 'false');
                    }
                }
            });
        });
    }

    loadHints();
});
