const translations = {
  tr: {
    title: "PDF Sayfa & Kelime Sayacı",
    langSwitch: "🌐 EN",
    analyze: "📊 Analiz Et",
    download: "⬇️ Excel İndir",
    clear: "🧹 Temizle",
    counter: "Girilen PDF: {total} | Analiz edilen: {analyzed}",
    loading: "Yükleniyor",
    error: "Hata",
    url: "PDF URL",
    pages: "Sayfa Sayısı",
    words: "Kelime Sayısı",
    pastePlaceholder: "Excel'den PDF URL'lerini buraya yapıştırın..."
  },
  en: {
    title: "PDF Page & Word Counter",
    langSwitch: "🌐 TR",
    analyze: "📊 Analyze",
    download: "⬇️ Download Excel",
    clear: "🧹 Clear",
    counter: "Total PDFs: {total} | Analyzed: {analyzed}",
    loading: "Loading",
    error: "Error",
    url: "PDF URL",
    pages: "Page Count",
    words: "Word Count",
    pastePlaceholder: "Paste PDF URLs from Excel here..."
  }
};

document.addEventListener("DOMContentLoaded", () => {
    const pasteArea = document.getElementById("pasteArea");
    const analyzeButton = document.getElementById("analyzeButton");
    const downloadButton = document.getElementById("downloadButton");
    const clearButton = document.getElementById("clearButton"); 
    const resultsTable = document.getElementById("resultsTable").getElementsByTagName("tbody")[0];
    let results = [];

    function updateResultsInfo(total, analyzed) {
      const infoEl = document.getElementById("resultsInfo");
      const template = translations[currentLang].counter;
      infoEl.textContent = template
        .replace("{total}", total)
        .replace("{analyzed}", analyzed);
    }

    pasteArea.addEventListener("paste", async (event) => {
    event.preventDefault();
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData("Text");

    const currentTextInPasteArea = pasteArea.value.trim();
    const currentUrlsInPasteArea = currentTextInPasteArea.split(/[\r\n]+/).filter(u => u.trim());

    const pastedUrls = pastedText.match(/https?:\/\/[^\s]+/gi) || [];

    const allUniqueUrls = [...new Set([...currentUrlsInPasteArea, ...pastedUrls])];

    while (resultsTable.firstChild) {
        resultsTable.removeChild(resultsTable.firstChild);
    }
    document.getElementById("resultsContainer").style.display = "block";

    let invalidCount = 0;

    for (const url of allUniqueUrls) {
        const row = resultsTable.insertRow();
        row.insertCell().textContent = url;

        if (!url.toLowerCase().endsWith(".pdf")) {
            // Geçersiz dosya
            row.insertCell().textContent = translations[currentLang].error || "Hatalı dosya";
            row.insertCell().textContent = translations[currentLang].error || "Hatalı dosya";
            row.style.color = "red"; // Satırı kırmızı yap
            results.push([url, "Hatalı dosya", "Hatalı dosya"]);

            invalidCount++;
            continue;
        }

        // Geçerli PDF için yükleniyor yaz
        row.insertCell().textContent = translations[currentLang].loading;
        row.insertCell().textContent = "";
    }

    pasteArea.value = allUniqueUrls.join("\n");

    if (resultsTable.rows.length > 0) {
        analyzeButton.disabled = false;
        downloadButton.disabled = true;
        clearButton.disabled = false;
    }

    updateResultsInfo(allUniqueUrls.length, 0);

    if (invalidCount > 0) {
        alert(`${invalidCount} ${currentLang === "tr" ? "adet geçersiz dosya tespit edildi" : "invalid file(s) detected."}`);
    }
});

   analyzeButton.addEventListener("click", async () => {
    const rows = resultsTable.querySelectorAll("tr");
    results = results.filter(r => r[1] === "Hatalı dosya" || r[1] === "Error");

    for (let i = 0; i < rows.length; i++) {
        const url = rows[i].cells[0].textContent;
        if (!url.toLowerCase().endsWith(".pdf")) continue;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const buf = await res.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

            const numPages = pdf.numPages;
            let textContent = "";

            for (let j = 1; j <= numPages; j++) {
                const page = await pdf.getPage(j);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(" ");
                textContent += " " + pageText;
            }

            const wordCount = textContent.trim().split(/\s+/).length;
            rows[i].cells[1].textContent = numPages;
            rows[i].cells[2].textContent = wordCount;
            results.push([url, numPages, wordCount]);
        } catch (error) {
            console.error(`PDF işlenemedi: ${url}`, error);
            rows[i].cells[1].textContent = "Hata";
            rows[i].cells[2].textContent = "Hata";
            results.push([url, "Hata", "Hata"]);
        }
        updateResultsInfo(rows.length, i + 1);
    }
    downloadButton.disabled = false;
});

    downloadButton.addEventListener("click", () => {
        const worksheet = XLSX.utils.aoa_to_sheet([["PDF URL", "Sayfa Sayısı", "Kelime Sayısı"], ...results]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, worksheet, "PDF Raporu");
        XLSX.writeFile(wb, "pdf_raporu.xlsx");
    });

    clearButton.addEventListener("click", () => {
        pasteArea.value = "";

        while (resultsTable.firstChild) {
            resultsTable.removeChild(resultsTable.firstChild);
        }
        document.getElementById("resultsTable").getElementsByTagName("tbody")[0].innerHTML = "";
        document.getElementById("resultsContainer").style.display = "none";

        results = [];
        analyzeButton.disabled = true;
        downloadButton.disabled = true;
        clearButton.disabled = true;
        updateResultsInfo(0, 0);

    });
});

let currentLang = "tr";

function updateTexts() {
  const elements = document.querySelectorAll("[data-msg]");
  elements.forEach(el => {
    const key = el.getAttribute("data-msg");
    if (translations[currentLang] && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });

    const counterEl = document.querySelector("[data-msg-dynamic='counter']");
  if (counterEl) {
    const currentText = counterEl.textContent;
    const countMatch = currentText.match(/\d+/);
    const count = countMatch ? countMatch[0] : "0";
    const newText = translations[currentLang]["counter"].replace("{total}", 0).replace("{analyzed}", 0);
    counterEl.textContent = newText;
  }

  const area = document.querySelector("[data-msg-placeholder]");
  if (area) {
    const key = area.getAttribute("data-msg-placeholder");
    area.placeholder = translations[currentLang][key];
  }
}

document.getElementById("langSwitch").addEventListener("click", () => {
  currentLang = currentLang === "tr" ? "en" : "tr";
  updateTexts();
});
