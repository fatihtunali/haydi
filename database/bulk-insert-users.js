const bcrypt = require('bcrypt');
const { pool } = require('../backend/config/database');

/**
 * Bulk insert users into the database
 * Converts Turkish names to usernames and hashes passwords
 */

// 100 kullanıcı listesi
const users = [
    { name: 'Ahmet Yıldız', email: 'ahmet.yildiz@gmail.com' },
    { name: 'Mehmet Kaya', email: 'mehmet.kaya@gmail.com' },
    { name: 'Ayşe Demir', email: 'ayse.demir@gmail.com' },
    { name: 'Fatma Çelik', email: 'fatma.celik@gmail.com' },
    { name: 'Mustafa Şahin', email: 'mustafa.sahin@gmail.com' },
    { name: 'Emine Yılmaz', email: 'emine.yilmaz@gmail.com' },
    { name: 'Ali Koç', email: 'ali.koc@gmail.com' },
    { name: 'Zeynep Arslan', email: 'zeynep.arslan@gmail.com' },
    { name: 'Hüseyin Polat', email: 'huseyin.polat@gmail.com' },
    { name: 'Hatice Aydın', email: 'hatice.aydin@gmail.com' },
    { name: 'İbrahim Kurt', email: 'ibrahim.kurt@gmail.com' },
    { name: 'Elif Özdemir', email: 'elif.ozdemir@gmail.com' },
    { name: 'Ramazan Güneş', email: 'ramazan.gunes@gmail.com' },
    { name: 'Selin Öztürk', email: 'selin.ozturk@gmail.com' },
    { name: 'Burak Erdoğan', email: 'burak.erdogan@gmail.com' },
    { name: 'Merve Aksoy', email: 'merve.aksoy@gmail.com' },
    { name: 'Emre Tunç', email: 'emre.tunc@gmail.com' },
    { name: 'Gizem Bulut', email: 'gizem.bulut@gmail.com' },
    { name: 'Serkan Koçak', email: 'serkan.kocak@gmail.com' },
    { name: 'Derya Şen', email: 'derya.sen@gmail.com' },
    { name: 'Onur Tekin', email: 'onur.tekin@gmail.com' },
    { name: 'Ceren Acar', email: 'ceren.acar@gmail.com' },
    { name: 'Barış Yavuz', email: 'baris.yavuz@gmail.com' },
    { name: 'Ebru Toprak', email: 'ebru.toprak@gmail.com' },
    { name: 'Cem Yurt', email: 'cem.yurt@gmail.com' },
    { name: 'Deniz Kılıç', email: 'deniz.kilic@gmail.com' },
    { name: 'Can Duman', email: 'can.duman@gmail.com' },
    { name: 'Özge Taş', email: 'ozge.tas@gmail.com' },
    { name: 'Kemal Kaplan', email: 'kemal.kaplan@gmail.com' },
    { name: 'Seda Erdem', email: 'seda.erdem@gmail.com' },
    { name: 'Tolga Aslan', email: 'tolga.aslan@gmail.com' },
    { name: 'Pınar Bal', email: 'pinar.bal@gmail.com' },
    { name: 'Okan Güler', email: 'okan.guler@gmail.com' },
    { name: 'Esra Yüksel', email: 'esra.yuksel@gmail.com' },
    { name: 'Volkan Karaca', email: 'volkan.karaca@gmail.com' },
    { name: 'Dilek Çiftçi', email: 'dilek.ciftci@gmail.com' },
    { name: 'Sinan Doğan', email: 'sinan.dogan@gmail.com' },
    { name: 'Neslihan Başar', email: 'neslihan.basar@gmail.com' },
    { name: 'Hakan Özer', email: 'hakan.ozer@gmail.com' },
    { name: 'Burcu Kara', email: 'burcu.kara@gmail.com' },
    { name: 'Murat Yiğit', email: 'murat.yigit@gmail.com' },
    { name: 'Gülşen Bozkurt', email: 'gulsen.bozkurt@gmail.com' },
    { name: 'Erhan Durmaz', email: 'erhan.durmaz@gmail.com' },
    { name: 'Melis Öz', email: 'melis.oz@gmail.com' },
    { name: 'Tuncay Bilgin', email: 'tuncay.bilgin@gmail.com' },
    { name: 'Yasemin Türk', email: 'yasemin.turk@gmail.com' },
    { name: 'Orhan Ateş', email: 'orhan.ates@gmail.com' },
    { name: 'Tuğba Kocaman', email: 'tugba.kocaman@gmail.com' },
    { name: 'Fikret Yalçın', email: 'fikret.yalcin@gmail.com' },
    { name: 'Serap Çakır', email: 'serap.cakir@gmail.com' },
    { name: 'Engin Özkaya', email: 'engin.ozkaya@gmail.com' },
    { name: 'Meltem Uçar', email: 'meltem.ucar@gmail.com' },
    { name: 'Serdar İnan', email: 'serdar.inan@gmail.com' },
    { name: 'Nilüfer Soylu', email: 'nilufer.soylu@gmail.com' },
    { name: 'Selim Yurt', email: 'selim.yurt@gmail.com' },
    { name: 'Gonca Kale', email: 'gonca.kale@gmail.com' },
    { name: 'Levent Önal', email: 'levent.onal@gmail.com' },
    { name: 'Sevgi Sezer', email: 'sevgi.sezer@gmail.com' },
    { name: 'Ufuk Yaman', email: 'ufuk.yaman@gmail.com' },
    { name: 'Pelin Savaş', email: 'pelin.savas@gmail.com' },
    { name: 'Halil Boyraz', email: 'halil.boyraz@gmail.com' },
    { name: 'Sibel Ulus', email: 'sibel.ulus@gmail.com' },
    { name: 'Tarık Şimşek', email: 'tarik.simsek@gmail.com' },
    { name: 'Aylin Yurt', email: 'aylin.yurt@gmail.com' },
    { name: 'Faruk Demirci', email: 'faruk.demirci@gmail.com' },
    { name: 'Lale Koçer', email: 'lale.kocer@gmail.com' },
    { name: 'Yasin Ünlü', email: 'yasin.unlu@gmail.com' },
    { name: 'Gül Güven', email: 'gul.guven@gmail.com' },
    { name: 'Haldun Bayram', email: 'haldun.bayram@gmail.com' },
    { name: 'Nurten Sever', email: 'nurten.sever@gmail.com' },
    { name: 'İsmail Işık', email: 'ismail.isik@gmail.com' },
    { name: 'Sevinç Altın', email: 'sevinc.altin@gmail.com' },
    { name: 'Kadir Eren', email: 'kadir.eren@gmail.com' },
    { name: 'Şenay Turan', email: 'senay.turan@gmail.com' },
    { name: 'Recep Yavuz', email: 'recep.yavuz@gmail.com' },
    { name: 'Filiz Kaynak', email: 'filiz.kaynak@gmail.com' },
    { name: 'Ömer Gürbüz', email: 'omer.gurbuz@gmail.com' },
    { name: 'Hülya Çetin', email: 'hulya.cetin@gmail.com' },
    { name: 'Selçuk Taşkın', email: 'selcuk.taskin@gmail.com' },
    { name: 'Necla Yüceer', email: 'necla.yuceer@gmail.com' },
    { name: 'Cengiz Avcı', email: 'cengiz.avci@gmail.com' },
    { name: 'Ayla Demir', email: 'ayla.demir@gmail.com' },
    { name: 'Salih Işıl', email: 'salih.isil@gmail.com' },
    { name: 'Nalan Erkan', email: 'nalan.erkan@gmail.com' },
    { name: 'Ercan Yener', email: 'ercan.yener@gmail.com' },
    { name: 'Fadime Özkan', email: 'fadime.ozkan@gmail.com' },
    { name: 'Adem Uz', email: 'adem.uz@gmail.com' },
    { name: 'Müge Yıldırım', email: 'muge.yildirim@gmail.com' },
    { name: 'Veli Şeker', email: 'veli.seker@gmail.com' },
    { name: 'Songül Eryılmaz', email: 'songul.eryilmaz@gmail.com' },
    { name: 'Tamer Kırgız', email: 'tamer.kirgiz@gmail.com' },
    { name: 'Kezban Demirtaş', email: 'kezban.demirtas@gmail.com' },
    { name: 'Rıza Kırbaş', email: 'riza.kirbas@gmail.com' },
    { name: 'Nuray Çolak', email: 'nuray.colak@gmail.com' },
    { name: 'Şükrü Bayrak', email: 'sukru.bayrak@gmail.com' },
    { name: 'Hacer Oran', email: 'hacer.oran@gmail.com' },
    { name: 'Ergün Şahin', email: 'ergun.sahin@gmail.com' }
];

/**
 * Convert Turkish name to username
 * @param {string} name - Full name (e.g., "Ahmet Yıldız")
 * @returns {string} Username (e.g., "ahmet.yildiz")
 */
function nameToUsername(name) {
    return name
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/İ/g, 'i')
        .replace(/ /g, '.')
        .trim();
}

/**
 * Generate a random password
 * @returns {string} Random 8-character password
 */
function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Bulk insert users into database
 */
async function bulkInsertUsers() {
    console.log('🚀 Kullanıcı toplu ekleme başlatılıyor...\n');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const username = nameToUsername(user.name);
        const password = 'HHB2025!'; // Default password for all users

        try {
            // Check if user already exists
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE email = ? OR username = ?',
                [user.email, username]
            );

            if (existing.length > 0) {
                console.log(`⚠️  ${i + 1}/${users.length} - ${user.name} (${username}) - Zaten kayıtlı`);
                errorCount++;
                errors.push({ user: user.name, reason: 'Kullanıcı zaten mevcut' });
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            await pool.query(
                `INSERT INTO users (username, email, password, full_name, points)
                 VALUES (?, ?, ?, ?, 0)`,
                [username, user.email, hashedPassword, user.name]
            );

            successCount++;
            console.log(`✅ ${i + 1}/${users.length} - ${user.name} (${username}) - Eklendi`);
        } catch (error) {
            errorCount++;
            errors.push({ user: user.name, reason: error.message });
            console.log(`❌ ${i + 1}/${users.length} - ${user.name} - Hata: ${error.message}`);
        }
    }

    console.log('\n📊 Özet:');
    console.log(`✅ Başarılı: ${successCount}`);
    console.log(`❌ Hatalı: ${errorCount}`);

    if (errors.length > 0) {
        console.log('\n⚠️  Hatalar:');
        errors.forEach((err, idx) => {
            console.log(`${idx + 1}. ${err.user}: ${err.reason}`);
        });
    }

    console.log('\n🔐 Varsayılan Şifre: HHB2025!');
    console.log('📝 Not: Kullanıcılar ilk girişte şifrelerini değiştirmelidir.\n');
}

// Run the script
bulkInsertUsers()
    .then(() => {
        console.log('✅ İşlem tamamlandı');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Kritik hata:', error);
        process.exit(1);
    });
