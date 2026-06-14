# ⚗️ GAS LAW SOLVER LAB
## ห้องทดลองช่วยทำโจทย์กฎของแก๊ส — สำหรับนักเรียน ม.5

> เครื่องมือช่วยทำโจทย์เคมีเรื่องแก๊สแบบอินเตอร์แอคทีฟ  
> ประกอบใบงาน **GAS LAW MISSION** ครอบคลุม 3 กฎหลัก

---

## 🗂️ โครงสร้างไฟล์

```
gas-law-solver-lab/
├── index.html     ← โครงสร้าง HTML ทั้งหมด
├── style.css      ← สไตล์และการออกแบบ (Light Mode)
├── script.js      ← Logic การคำนวณ, กราฟ, แอนิเมชัน
└── README.md      ← คู่มือนี้
```

---

## 🖥️ วิธีรันในเครื่อง (Local)

ไม่ต้องติดตั้งอะไรเพิ่ม! เปิดได้ทันที:

```bash
# วิธีที่ 1: ดับเบิลคลิกไฟล์
เปิด index.html ด้วย Chrome / Firefox / Edge

# วิธีที่ 2: VS Code Live Server
1. ติดตั้ง Extension "Live Server"
2. คลิกขวาที่ index.html → Open with Live Server

# วิธีที่ 3: Python HTTP Server
cd gas-law-solver-lab
python -m http.server 8000
# เปิด http://localhost:8000
```

---

## 🚀 วิธีอัปขึ้น GitHub และเปิด GitHub Pages

### ขั้นที่ 1: สร้าง Repository บน GitHub
1. ไปที่ [github.com](https://github.com) → Log in
2. คลิก **New Repository**
3. ตั้งชื่อ เช่น `gas-law-solver-lab`
4. เลือก **Public** → Create Repository

### ขั้นที่ 2: อัปโหลดไฟล์
```bash
# วิธี A: ผ่าน Terminal
git init
git add .
git commit -m "Initial commit: Gas Law Solver Lab"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gas-law-solver-lab.git
git push -u origin main

# วิธี B: ลากและวาง (ง่ายกว่า)
ไปที่ Repository → คลิก "Add file" → "Upload files"
ลาก index.html, style.css, script.js, README.md ใส่
```

### ขั้นที่ 3: เปิด GitHub Pages
1. ไปที่ **Settings** ของ Repository
2. เลื่อนลงหาหัวข้อ **Pages** (ในเมนูซ้าย)
3. Source: เลือก **Deploy from a branch**
4. Branch: เลือก **main** → folder: **/ (root)** → Save
5. รอ 1-2 นาที แล้วเข้า URL:  
   `https://YOUR_USERNAME.github.io/gas-law-solver-lab/`

---

## 📚 วิธีใช้งานสำหรับนักเรียน

### 1. เปิดแอพ
เปิด URL จาก GitHub Pages หรือไฟล์ index.html ในเครื่อง

### 2. เลือกโหมดที่ต้องการ

| เมนู | ใช้กับโจทย์ |
|------|-------------|
| ⚡ Ideal Gas Solver | PV = nRT (ข้อ 1-8 PART 1) |
| 🧪 Dalton Mixer Lab | Ptotal = ΣPi (ข้อ 1-6 PART 2) |
| 🏎️ Gas Race Simulator | r1/r2 = √(M2/M1) (ข้อ 1-9 PART 3) |
| 📋 Worksheet Mode | เลือกข้อจากใบงาน |

### 3. Worksheet Mode (แนะนำ)
1. คลิก **Worksheet Mode**
2. เลือกข้อที่ต้องการจากแผงซ้าย
3. กด **"เปิด Solver พร้อมค่าเริ่มต้น"** — แอพตั้งค่าให้อัตโนมัติ
4. ใช้ **Hint 1, 2, 3** ถ้าติดขัด (ไม่เฉลยทันที)
5. กด **คำนวณ** เพื่อดูวิธีทำทีละขั้น

### 4. สร้างการ์ดสรุป
- คลิกปุ่ม 🎴 มุมล่างขวา
- กรอกชื่อ, ชั้น, เลขที่
- กด "สร้างการ์ด" → "บันทึกภาพ" เพื่อส่งครู

---

## ➕ วิธีเพิ่มโจทย์ใหม่

เปิด `script.js` แล้วหา section `WORKSHEET` เพิ่มข้อใน array ที่ต้องการ:

```javascript
// ตัวอย่างเพิ่มโจทย์ PART 1
{ 
  id:'1-9',
  text:'แก๊ส X จำนวน 0.800 mol ที่ 47°C ปริมาตร 12.0 L จงหาความดัน',
  given:{n:'0.800', V:'12.0', T:'47', uT:'C'}, 
  find:'P', 
  solver:'ideal',
  hints:[
    'ใช้สูตร P = nRT/V',
    'แปลง T: 47 + 273 = 320 K',
    'P = (0.800 × 0.0821 × 320) / 12.0'
  ]
}
```

**รายการ solver ที่ใช้ได้:**
- `'ideal'` — ส่งไปหน้า Ideal Gas Solver
- `'dalton'` — ส่งไปหน้า Dalton Lab  
- `'graham'` — ส่งไปหน้า Gas Race

---

## 🎨 วิธีเปลี่ยนสีหรือปรับแต่ง

เปิด `style.css` ส่วน `:root` ด้านบน:

```css
:root {
  --blue-dark:   #1A3A6B;  /* สีน้ำเงินเข้ม */
  --blue-mid:    #2E6DB4;  /* สีน้ำเงินกลาง */
  --blue-light:  #4A90D9;  /* สีฟ้า */
  --mint:        #4CAF8A;  /* สีเขียวมิ้นต์ */
  --cyan:        #00BCD4;  /* สีฟ้าสด */
  /* เปลี่ยนค่า hex เพื่อปรับสีทั้งระบบ */
}
```

**เปลี่ยนชื่อครูหรือโรงเรียน:**
ค้นหาคำว่า `GAS LAW SOLVER LAB` ใน index.html แล้วแก้ได้เลย

---

## 🔧 แก้ปัญหาที่พบบ่อย

| ปัญหา | วิธีแก้ |
|-------|---------|
| กราฟไม่แสดง | ตรวจว่า Chart.js โหลดได้ (ต้องออนไลน์) |
| ฟอนต์ผิด | ตรวจการเชื่อมต่ออินเตอร์เน็ต (Google Fonts) |
| GitHub Pages ไม่ทำงาน | รอ 5 นาทีหลัง Deploy, ตรวจ Settings > Pages |
| แอพช้า | ลองเปิดในแท็บใหม่หรือ Hard Refresh (Ctrl+Shift+R) |

---

## 📋 สูตรที่ใช้ในแอพ

```
กฎแก๊สอุดมคติ:   PV = nRT
                  R = 0.0821 L·atm/mol·K

กฎของดาลตัน:     Ptotal = P1 + P2 + P3 + ...
                  Xi = ni / ntotal
                  Pi = Xi × Ptotal

กฎของเกรแฮม:     r1/r2 = √(M2/M1)

หน่วยที่รองรับ:   P: atm, mmHg, kPa
                  V: L, mL
                  T: °C, K
```

---

## 📱 ความเข้ากันได้

✅ Chrome, Firefox, Edge, Safari  
✅ มือถือ, แท็บเล็ต, คอมพิวเตอร์  
✅ ทำงานได้ Offline (ยกเว้นกราฟต้องใช้ CDN)  
❌ ไม่รองรับ Internet Explorer

---

## 👩‍🏫 หมายเหตุสำหรับครู

- **ค่า R = 0.0821** L·atm/mol·K ใช้ตลอดทั้งแอพ
- คำตอบตัวเลขอาจต่างเล็กน้อยจากการปัดเศษ (±0.01)
- Worksheet Mode ไม่ล็อคค่า — นักเรียนปรับโจทย์เองได้
- แนะนำให้ใช้คู่กับใบงาน GAS LAW MISSION

---

*สร้างด้วย HTML, CSS, JavaScript ล้วน — ใช้งานได้บน GitHub Pages ทันที*
