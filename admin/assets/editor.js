// ===== Trinh soan thao Quill cho noi dung phim =====
// Thay <textarea data-editor> bang editor; khi submit chep HTML vao lai textarea.
// HTML duoc loc lai o server (sanitize_html) nen khong lo XSS.
(function () {
    if (typeof Quill === "undefined") return; // khong tai duoc CDN -> dung textarea thuong

    document.querySelectorAll("textarea[data-editor]").forEach((textarea) => {
        const box = document.createElement("div");
        textarea.insertAdjacentElement("afterend", box);
        textarea.hidden = true;

        const quill = new Quill(box, {
            theme: "snow",
            placeholder: "Nhập nội dung, tóm tắt phim...",
            modules: {
                toolbar: [
                    [{ header: [2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["blockquote", "link"],
                    ["clean"]
                ]
            }
        });

        if (textarea.value.trim()) {
            quill.clipboard.dangerouslyPasteHTML(textarea.value);
        }

        textarea.form.addEventListener("submit", () => {
            textarea.value = quill.getText().trim() ? quill.getSemanticHTML() : "";
        });
    });
})();
