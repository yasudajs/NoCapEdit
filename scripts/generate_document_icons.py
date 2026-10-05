"""
NoCapEdit 拡張子別ファイルアイコン生成スクリプト
icons/document.png をベースに、全対応拡張子（47種）の専用アイコン（ICO / PNG）を一括生成します。
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont

# プロジェクトルート基準のパス設定
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
BASE_ICON_PATH = os.path.join(PROJECT_ROOT, "icons", "document.png")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "icons", "documents")

# フォント設定 (Segoe UI Black, なければ Arial Bold)
FONT_CANDIDATES = [
    "C:/Windows/Fonts/seguibl.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]
FONT_PATH = None
for f in FONT_CANDIDATES:
    if os.path.exists(f):
        FONT_PATH = f
        break

if not FONT_PATH:
    print("Warning: Standard bold fonts not found, using default.")

# 帯バナーの座標 (書類下部の下から2段目の罫線から底辺まで)
# x: 91〜419, y: 350〜467 (高さ約117px)
BANNER_RECT = [91, 350, 419, 467]
BANNER_RADIUS = 10
CENTER_X = (BANNER_RECT[0] + BANNER_RECT[2]) / 2  # 255.0
CENTER_Y = (BANNER_RECT[1] + BANNER_RECT[3]) / 2  # 408.5

# ICO格納サイズ (Windows標準マルチ解像度)
ICO_SIZES = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]

# 拡張子定義辞書: key -> (表示テキスト, RGBタプル, 説明, [拡張子リスト])
ICON_DEFINITIONS = {
    # 専用形式
    "nctx": ("NCTX", (214, 48, 49), "NoCapEdit Text", [".nctx"]),
    "ncmd": ("NCMD", (183, 21, 64), "NoCapEdit Markdown", [".ncmd"]),

    # 汎用テキスト・ログ
    "txt":  ("TXT",  (75, 101, 132), "Plain Text", [".txt", ".text"]),
    "log":  ("LOG",  (87, 101, 116), "Log File", [".log"]),

    # ドキュメント
    "md":   ("MD",   (9, 132, 227),  "Markdown", [".md", ".markdown"]),

    # 表計算・データ
    "csv":  ("CSV",  (16, 124, 65),  "CSV Spreadsheet", [".csv"]),
    "tsv":  ("TSV",  (0, 148, 50),   "TSV Spreadsheet", [".tsv"]),

    # データ・設定・マークアップ
    "json": ("JSON", (230, 126, 34), "JSON Data", [".json", ".jsonl"]),
    "xml":  ("XML",  (243, 156, 18), "XML Document", [".xml"]),
    "yaml": ("YAML", (225, 112, 85), "YAML Document", [".yaml", ".yml"]),
    "ini":  ("INI",  (44, 62, 80),   "Configuration", [".ini"]),
    "conf": ("CONF", (44, 62, 80),   "Configuration", [".conf"]),
    "cfg":  ("CFG",  (44, 62, 80),   "Configuration", [".cfg"]),
    "env":  ("ENV",  (52, 73, 94),   "Environment", [".env"]),

    # Web標準
    "html": ("HTML", (228, 77, 38),  "HTML Document", [".html", ".htm"]),
    "css":  ("CSS",  (38, 77, 228),  "CSS Stylesheet", [".css"]),
    "scss": ("SCSS", (207, 100, 154),"Sass Stylesheet", [".scss"]),
    "js":   ("JS",   (212, 172, 13), "JavaScript", [".js", ".mjs"]),
    "ts":   ("TS",   (49, 120, 198), "TypeScript", [".ts"]),
    "jsx":  ("JSX",  (0, 168, 255),  "React JSX", [".jsx"]),
    "tsx":  ("TSX",  (39, 60, 117),  "React TSX", [".tsx"]),

    # プログラミング言語
    "py":   ("PY",   (55, 118, 171), "Python Script", [".py", ".pyw"]),
    "rs":   ("RS",   (160, 82, 45),  "Rust Source", [".rs"]),
    "go":   ("GO",   (0, 173, 216),  "Go Source", [".go"]),
    "java": ("JAVA", (231, 111, 0),  "Java Source", [".java"]),
    "c":    ("C",    (92, 107, 192), "C Source", [".c"]),
    "h":    ("H",    (126, 87, 194), "C Header", [".h"]),
    "cpp":  ("CPP",  (63, 81, 181),  "C++ Source", [".cpp"]),
    "hpp":  ("HPP",  (48, 63, 159),  "C++ Header", [".hpp"]),
    "cs":   ("CS",   (108, 92, 231), "C# Source", [".cs"]),
    "php":  ("PHP",  (119, 123, 180),"PHP Script", [".php"]),
    "rb":   ("RB",   (204, 52, 45),  "Ruby Script", [".rb"]),
    "lua":  ("LUA",  (0, 0, 128),    "Lua Script", [".lua"]),
    "sql":  ("SQL",  (0, 128, 128),  "SQL Database", [".sql"]),
    "sh":   ("SH",   (39, 174, 96),  "Shell Script", [".sh", ".bash"]),
    "ps1":  ("PS1",  (1, 36, 86),    "PowerShell", [".ps1"]),

    # バックアップ・一時
    "bak":  ("BAK",  (127, 140, 141),"Backup File", [".bak"]),
    "tmp":  ("TMP",  (127, 140, 141),"Temporary File", [".tmp", ".temp"]),
}


def get_font_size(text: str) -> int:
    """文字数に応じた最適フォントサイズを返却"""
    n = len(text)
    if n <= 2:
        return 96
    elif n == 3:
        return 94
    elif n == 4:
        return 78
    elif n == 5:
        return 64
    else:
        return 52


def generate_icon(base_im: Image.Image, text: str, color_rgb: tuple) -> Image.Image:
    """原画の上に角丸バナーとテキストを合成"""
    im = base_im.copy()
    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # 角丸帯バナー
    draw.rounded_rectangle(BANNER_RECT, radius=BANNER_RADIUS, fill=(*color_rgb, 255))

    # 中央配置テキスト
    fsize = get_font_size(text)
    font = ImageFont.truetype(FONT_PATH, fsize) if FONT_PATH else ImageFont.load_default()
    draw.text((CENTER_X, CENTER_Y), text, font=font, fill=(255, 255, 255, 255), anchor="mm")

    return Image.alpha_composite(im, overlay)


def main():
    if not os.path.exists(BASE_ICON_PATH):
        print(f"Error: Base icon not found: {BASE_ICON_PATH}")
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    base_im = Image.open(BASE_ICON_PATH).convert("RGBA")

    print(f"Base icon loaded: {BASE_ICON_PATH} ({base_im.size})")
    print(f"Generating document icons to: {OUTPUT_DIR}")
    print(f"Total icon definitions: {len(ICON_DEFINITIONS)}")

    total_exts = 0
    for key, (text, color, desc, exts) in ICON_DEFINITIONS.items():
        total_exts += len(exts)
        icon_img = generate_icon(base_im, text, color)

        # PNG出力 (512x512)
        png_path = os.path.join(OUTPUT_DIR, f"document_{key}.png")
        icon_img.save(png_path, "PNG")

        # マルチ解像度ICO出力
        ico_path = os.path.join(OUTPUT_DIR, f"document_{key}.ico")
        icon_img.save(ico_path, format="ICO", sizes=ICO_SIZES)

        print(f"  [OK] {key.upper():<5} -> document_{key}.ico (extensions: {', '.join(exts)})")

    print("\nGeneration completed successfully!")
    print(f"  - Generated icon files: {len(ICON_DEFINITIONS)} ICOs & {len(ICON_DEFINITIONS)} PNGs")
    print(f"  - Covered file extensions: {total_exts}")


if __name__ == "__main__":
    main()
