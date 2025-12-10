document.addEventListener('DOMContentLoaded', () => {
    // 【修正点】絶対パスを使用し、GitHub Pagesでの読み込み安定性を確保
    const csvFilePath = '/hintdata.csv'; 
    const container = document.getElementById('hint-container');

    // CSVファイルを読み込む関数
    async function loadHints() {
        try {
            const response = await fetch(csvFilePath);
            const csvText = await response.text();
            
            const hints = parseCSV(csvText);
            
            // ヒントをステップごとにグループ化
            const groupedHints = hints.reduce((acc, hint) => {
                const stepKey = hint.Step;
                
                if (!acc[stepKey]) {
                    // グループ初期化: StepTitleが定義されているかチェック
                    // StepTitleが空でなければそのタイトルを使用し、そうでなければデフォルトを使用
                    const title = hint.StepTitle || `ステップ ${hint.Step}`;
                    
                    acc[stepKey] = {
                        title: title,
                        hints: []
                    };
                }
                
                // 【重要】StepTitleが空欄でない場合は、グループ化の際にStepTitleを上書きしないようにする
                // ただし、CSVでは最初の行にのみタイトルが設定されている前提なので、このロジックでOK。

                acc[stepKey].hints.push(hint);
                return acc;
            }, {});

            // HTMLにレンダリング
            renderHints(groupedHints, container);
            
            // イベントリスナーを設定
            setupToggleListeners();

        } catch (error) {
            console.error('ヒントデータの読み込み中にエラーが発生しました:', error);
            // ユーザーにエラーを伝えるメッセージ
            container.innerHTML = '<p style="color: red;">ヒントデータを読み込めませんでした。ファイルパスとCSVの内容を確認してください。</p>';
        }
    }

    // CSVパースの簡易実装 (変更なし)
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        // ヘッダー行をスキップ
        const headers = lines[0].split(',');
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            let obj = {};
            headers.forEach((header, i) => {
                // CSVの各値をトリムしてオブジェクトに格納
                obj[header.trim()] = (values[i] || '').trim().replace(/^"|"$/g, ''); // 引用符を除去
            });
            return obj;
        });
    }

    // HTMLのレンダリング (ステップタイトルとヒントコンテンツの挿入)
    function renderHints(groupedHints, container) {
        for (const stepKey in groupedHints) {
            const stepGroup = groupedHints[stepKey];
            const stepData = stepGroup.hints;
            
            const stepDiv = document.createElement('div');
            stepDiv.className = 'hint-step';
            
            // === ステップヘッダー (トグル機能付き) の作成 ===
            const stepHeader = document.createElement('div');
            stepHeader.className = 'step-header';
            
            // ステップタイトル (カスタムタイトルを使用)
            const stepTitle = document.createElement('h2');
            stepTitle.textContent = stepGroup.title; 
            stepHeader.appendChild(stepTitle);

            // 「すべて表示/非表示」ボタン
            const toggleAllButton = document.createElement('button');
            toggleAllButton.textContent = 'すべて表示';
            toggleAllButton.className = 'toggle-all-button';
            toggleAllButton.dataset.targetStep = stepKey; 
            stepHeader.appendChild(toggleAllButton);

            stepDiv.appendChild(stepHeader);
            // ===============================================

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
                // 【重要】改行タグや画像タグを含むため、innerHTMLを使用
                contentDiv.innerHTML = `<p>${hint.Content}</p>`;
                contentDiv.setAttribute('aria-hidden', 'true');
                stepDiv.appendChild(contentDiv);
            });

            container.appendChild(stepDiv);
        }
    }

    // クリックイベントの設定 (複数同時開閉、再クリックで閉じるロジック)
    function setupToggleListeners() {
        // 1. 個別ヒントのトグル処理
        document.querySelectorAll('.hint-title').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                const targetContent = document.getElementById(targetId);
                const stepDiv = e.currentTarget.closest('.hint-step');

                if (!targetContent) return; 

                const isCurrentlyActive = targetContent.classList.contains('active');
                
                // クリックされたヒントをトグル（開閉）する
                if (isCurrentlyActive) {
                    // 既に開いている場合: 閉じる
                    targetContent.classList.remove('active');
                    e.currentTarget.setAttribute('aria-expanded', 'false');
                    targetContent.setAttribute('aria-hidden', 'true');
                } else {
                    // 閉じている場合: 開く
                    targetContent.classList.add('active');
                    e.currentTarget.setAttribute('aria-expanded', 'true');
                    targetContent.setAttribute('aria-hidden', 'false');
                }

                // ボタンの状態を更新
                updateToggleAllButton(stepDiv);
            });
        });

        // 2. ステップ全体トグルイベントリスナー (変更なし)
        document.querySelectorAll('.toggle-all-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const stepDiv = e.currentTarget.closest('.hint-step');
                const isClosing = e.currentTarget.textContent === 'すべて非表示';

                stepDiv.querySelectorAll('.hint-title').forEach(titleButton => {
                    const targetContent = document.getElementById(titleButton.dataset.target);

                    if (targetContent) {
                        if (isClosing) {
                            targetContent.classList.remove('active');
                            titleButton.setAttribute('aria-expanded', 'false');
                            targetContent.setAttribute('aria-hidden', 'true');
                        } else {
                            targetContent.classList.add('active');
                            titleButton.setAttribute('aria-expanded', 'true');
                            targetContent.setAttribute('aria-hidden', 'false');
                        }
                    }
                });
                
                // ボタンのテキストを切り替える
                e.currentTarget.textContent = isClosing ? 'すべて表示' : 'すべて非表示';
            });
        });
    }

    // ボタンの状態を更新する関数 (変更なし)
    function updateToggleAllButton(stepDiv) {
        const toggleAllButton = stepDiv.querySelector('.toggle-all-button');
        if (!toggleAllButton) return;
        
        const activeContents = stepDiv.querySelectorAll('.hint-content.active');

        if (activeContents.length > 0) {
            // 一つでも開いていれば「すべて非表示」
            toggleAllButton.textContent = 'すべて非表示';
        } else {
            // 全て閉じていれば「すべて表示」
            toggleAllButton.textContent = 'すべて表示';
        }
    }

    loadHints();
});
