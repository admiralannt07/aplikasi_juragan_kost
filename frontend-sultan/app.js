// --- KONFIGURASI --- 
const API_BASE = 'http://127.0.0.1:8000/api/';

// 1. CEK KEAMANAN (Cek Saku Celana) 
const AUTH_TOKEN = localStorage.getItem('sultan_token');

if (!AUTH_TOKEN) {
    // Kalau gak ada token, tendang ke gerbang depan 
    window.location.href = 'login.html';
}

// Tambahin "Token " di depannya buat header 
const TOKEN_HEADER = `Token ${AUTH_TOKEN}`;

// Format Duit Rupiah
const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

// Format Tanggal Header 
document.getElementById('tanggal-hari-ini').innerText = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// --- STATE MANAGEMENT ---
let allKamar = []; // Nyimpen data mentah
let allPenyewa = [];
let allRiwayat = [];
let chartInstance = null;
let kamarTableState = { page: 1, perPage: 10, search: '', status: 'ALL' };
let penyewaTableState = { page: 1, perPage: 10, search: '' };

// --- FUNGSI UTAMA: FETCH DATA --- 
async function fetchData() {
    try {
        const response = await fetch(`${API_BASE}kamar/`, {
            headers: {
                'Authorization': TOKEN_HEADER, // Pake token dinamis 
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            forceLogout();
        }

        if (!response.ok) throw new Error('Gagal ambil data.');

        const data = await response.json();
        allKamar = data.results || data;

        updateStats();
        renderKamar(allKamar);
        renderKamarTable();

    } catch (error) {
        console.error(error);
        alert("Gagal koneksi ke server. Pastikan Django running.");
    }
}

async function fetchPenyewa() {
    try {
        const response = await fetch(`${API_BASE}penyewa/`, { headers: { 'Authorization': TOKEN_HEADER, 'Content-Type': 'application/json' } });
        if (response.status === 401) { forceLogout(); }
        if (!response.ok) throw new Error('Gagal ambil data penyewa.');
        const data = await response.json();
        allPenyewa = data.results || data;
        renderPenyewaTable();
    } catch (error) {
        console.error(error);
    }
}

// --- LOGIC LOGOUT --- 
function logout() {
    openLogoutConfirm();
}

function forceLogout() {
    localStorage.removeItem('sultan_token');
    window.location.href = 'login.html';
}

function openLogoutConfirm() {
    openConfirmModal({
        title: 'Konfirmasi Logout',
        subtitle: 'Apa kamu yakin mau keluar, Juragan?',
        message: 'Kamu akan keluar dari sistem dan perlu login lagi.',
        confirmText: 'Logout',
        cancelText: 'Batal',
        confirmClass: 'btn-error',
        onConfirm: performLogout
    });
}

function performLogout() {
    document.getElementById('modal_detail').close();
    localStorage.removeItem('sultan_token');
    window.location.href = 'login.html';
}



function showToast(type, text) {
    ensureToastContainer();
    const container = document.getElementById('app-toast');
    const alertEl = document.createElement('div');
    alertEl.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg`;
    alertEl.innerHTML = `<span>${text}</span><button class="btn btn-sm btn-ghost" aria-label="Close">&times;</button>`;
    container.appendChild(alertEl);
    const closeBtn = alertEl.querySelector('button');
    const remove = () => { if (alertEl.parentNode) alertEl.parentNode.removeChild(alertEl); };
    closeBtn.addEventListener('click', remove);
    setTimeout(remove, 3000);
}

function showToastSuccess(text) { showToast('success', text); }
function showToastError(text) { showToast('error', text); }

function setSubmitting(formId, submitting) {
    const form = document.getElementById(formId);
    if (!form) return;
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (submitting) {
        btn.disabled = true;
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = `<span class="loading loading-spinner loading-sm"></span> Memproses...`;
    } else {
        btn.disabled = false;
        if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
    }
}

function ensureToastContainer() {
    if (!document.getElementById('app-toast')) {
        const el = document.createElement('div');
        el.id = 'app-toast';
        el.className = 'toast toast-top toast-center fixed top-4 left-1/2 -translate-x-1/2 z-[9999]';
        document.body.appendChild(el);
    }
}

function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.add('input-error');
    let msg = document.getElementById(`error_${inputId}`);
    if (!msg) {
        msg = document.createElement('span');
        msg.id = `error_${inputId}`;
        msg.className = 'text-error text-xs mt-1 block';
        input.parentElement.appendChild(msg);
    }
    msg.textContent = message;
}

function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.remove('input-error');
    const msg = document.getElementById(`error_${inputId}`);
    if (msg && msg.parentNode) msg.parentNode.removeChild(msg);
}

function isValidNomorKamar(n) {
    const s = (n || '').trim().toUpperCase();
    const regex1 = /^[A-Z]\d{3}$/;       // K001, A123
    const regex2 = /^[A-Z]-\d{2}$/;      // A-01, K-12
    return regex1.test(s) || regex2.test(s);
}

function openModal(title, subtitle, contentHtml, actionHtml) {
    const modal = document.getElementById('modal_detail');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-subtitle').innerText = subtitle;
    document.getElementById('modal-content').innerHTML = contentHtml || '';
    const actionBar = document.querySelector('.modal-action');
    if (actionBar) {
        actionBar.style.display = 'flex';
        actionBar.innerHTML = actionHtml || '<button class="btn" onclick="document.getElementById(\'modal_detail\').close()">Tutup</button>';
    }
    document.getElementById('modal_detail').showModal();
}

function openConfirmModal(opts) {
    const { title, subtitle, message, confirmText, cancelText, onConfirm, confirmClass } = opts;
    const contentHtml = `<div class="py-4">${message || ''}</div>`;
    const actionHtml = `
        <button class="btn" id="modal-cancel">${cancelText || 'Batal'}</button>
        <button class="btn ${confirmClass || 'btn-primary'}" id="modal-confirm">${confirmText || 'OK'}</button>
    `;
    openModal(title, subtitle, contentHtml, actionHtml);
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');
    cancelBtn.addEventListener('click', () => document.getElementById('modal_detail').close());
    confirmBtn.addEventListener('click', () => {
        document.getElementById('modal_detail').close();
        if (typeof onConfirm === 'function') onConfirm();
    });
}

// --- LOGIC NAVIGASI (SPA) --- 
function switchPage(pageId, element) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });

    // Show selected page
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    // Update menu active state
    document.querySelectorAll('.menu a').forEach(menu => {
        menu.classList.remove('active', 'bg-indigo-600', 'text-white');
        menu.classList.add('hover:text-white', 'hover:bg-slate-800');
    });

    if (element) {
        element.classList.add('active', 'bg-indigo-600', 'text-white');
        element.classList.remove('hover:text-white', 'hover:bg-slate-800');
    }

    // Load Data specific to page
    if (pageId === 'page-dashboard') {
        updateStats();
    } else if (pageId === 'page-kamar') {
        renderKamarTable();
    } else if (pageId === 'page-penyewa') {
        renderPenyewaTable();
    } else if (pageId === 'page-keuangan') {
        loadFinancialData();
    }

    try { localStorage.setItem('sultan_last_page', pageId); } catch { }
}

// --- UPDATE STATISTIK ---
function updateStats() {
    const total = allKamar.length;
    const terisi = allKamar.filter(k => k.status === 'ISI').length;
    const kosong = allKamar.filter(k => k.status === 'KOSONG').length;

    // Animasi angka (dikit biar keren)
    const elTotal = document.getElementById('total-kamar');
    const elIsi = document.getElementById('total-isi');
    const elKosong = document.getElementById('total-kosong');

    if (elTotal) elTotal.innerText = total;
    if (elIsi) elIsi.innerText = terisi;
    if (elKosong) elKosong.innerText = kosong;
}

// Ganti fungsi openPaymentModal yang lama dengan yang ini:

async function openPaymentModal(penyewaId = null) {
    const select = document.getElementById('pay-penyewa-id');
    const inputJumlah = document.getElementById('pay-jumlah');
    const inputKet = document.getElementById('pay-keterangan');
    const modal = document.getElementById('modal_payment');

    // 1. Reset Form
    inputJumlah.value = '';
    inputKet.value = '';

    // 2. Siapkan State Awal Dropdown
    select.innerHTML = '<option value="" disabled selected>-- Memuat Data Penyewa... --</option>';

    // 3. TAMPILKAN MODAL DULUAN (Biar User Gak Bingung)
    modal.showModal();

    // 4. Cek & Ambil Data (Jika Kosong)
    if (allPenyewa.length === 0) {
        await fetchPenyewa(); // Tunggu sampai fetch selesai
    }

    // 5. Isi Ulang Dropdown dengan Data Terbaru
    select.innerHTML = '<option value="" disabled selected>-- Pilih Penyewa --</option>';

    if (allPenyewa.length > 0) {
        allPenyewa.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            // Tampilkan Nama dan Nomor Kamar biar gampang milihnya
            const kamarInfo = p.kamar_detail ? ` (Kamar ${p.kamar_detail.nomor_kamar})` : ' (Belum ada kamar)';
            option.text = `${p.nama_lengkap}${kamarInfo}`;

            // Kalo dibuka dari tombol tabel penyewa (ada parameter penyewaId), otomatis terpilih
            if (penyewaId && p.id == penyewaId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } else {
        // Handle jika memang tidak ada data sama sekali
        const emptyOption = document.createElement('option');
        emptyOption.text = "Belum ada data penyewa aktif";
        emptyOption.disabled = true;
        select.appendChild(emptyOption);
    }
}

// Update fungsi submitPayment biar notifikasinya GANTENG

async function submitPayment() {
    const penyewaId = document.getElementById('pay-penyewa-id').value;
    const jumlah = document.getElementById('pay-jumlah').value;
    const keterangan = document.getElementById('pay-keterangan').value;

    // Validasi Input
    if (!penyewaId) {
        showToastError("Pilih penyewa dulu, Juragan!");
        return;
    }
    if (!jumlah) {
        showToastError("Jumlah duitnya berapa? Jangan kosong!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}riwayat-bayar/`, {
            method: 'POST',
            headers: {
                'Authorization': TOKEN_HEADER,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                penyewa: penyewaId,
                jumlah: jumlah,
                keterangan: keterangan
            })
        });

        if (response.ok) {
            // SUKSES: Tutup modal dulu, baru pamer notif
            document.getElementById('modal_payment').close();

            // INI DIA PERUBAHANNYA: Pake showToastSuccess
            showToastSuccess("Alhamdulillah! Pembayaran berhasil disimpan.");

            // Refresh data biar angkanya nambah real-time
            loadFinancialData();
        } else {
            // GAGAL DARI SERVER
            showToastError("Gagal menyimpan. Cek koneksi atau data.");
        }
    } catch (error) {
        console.error("Error:", error);
        // GAGAL KONEKSI
        showToastError("Terjadi kesalahan sistem. Coba lagi nanti.");
    }
}

let financialChart = null;

async function loadFinancialData() {
    try {
        const response = await fetch(`${API_BASE}financial-summary/`, {
            headers: { 'Authorization': TOKEN_HEADER }
        });
        const data = await response.json();

        // 1. Update Cards
        document.getElementById('keuangan-total').innerText = formatRupiah(data.total_pendapatan);
        document.getElementById('keuangan-bulan-ini').innerText = formatRupiah(data.pendapatan_bulan_ini);

        // 2. Update List Transaksi
        const listContainer = document.getElementById('list-transaksi');
        listContainer.innerHTML = '';

        if (data.recent_transactions.length === 0) {
            listContainer.innerHTML = '<div class="text-center text-slate-400 py-8 text-sm">Belum ada data transaksi.</div>';
        } else {
            data.recent_transactions.forEach(tx => {
                const item = `
                    <div class="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <i class="fas fa-arrow-down"></i>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-slate-800">${tx.penyewa}</p>
                                <p class="text-xs text-slate-500">${tx.keterangan || 'Pembayaran Kost'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-bold text-emerald-600">+ ${formatRupiah(tx.jumlah)}</p>
                            <p class="text-xs text-slate-400">${tx.tanggal}</p>
                        </div>
                    </div>
                `;
                listContainer.innerHTML += item;
            });
        }

        // 3. Update Chart
        const ctx = document.getElementById('chartPendapatan').getContext('2d');

        if (financialChart) {
            financialChart.destroy();
        }

        financialChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.grafik.labels,
                datasets: [{
                    label: 'Pendapatan (Rp)',
                    data: data.grafik.data,
                    backgroundColor: '#4f46e5',
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error loading financial data:", error);
    }
}

// --- RENDER GRID KAMAR ---
function renderKamar(data) {
    const grid = document.getElementById('kamar-grid');
    grid.innerHTML = '';

    if (data.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-slate-400">Tidak ada data kamar.</div>';
        return;
    }

    data.forEach(kamar => {
        // Tentukan Warna Berdasarkan Status
        let statusBadge = '';
        let cardBorder = '';
        let btnAction = '';

        if (kamar.status === 'KOSONG') {
            statusBadge = '<span class="badge badge-success badge-sm gap-1 text-white"><i class="fas fa-check"></i> Kosong</span>';
            cardBorder = 'hover:border-teal-400';
            // UPDATE TOMBOL INI:
            btnAction = `<button onclick="openCheckInModal(${kamar.id}, '${kamar.nomor_kamar}')" class="btn btn-sm btn-primary w-full bg-indigo-600 border-none text-white">Check In</button>`;
        } else if (kamar.status === 'ISI') {
            statusBadge = '<span class="badge badge-error badge-sm gap-1 text-white"><i class="fas fa-user"></i> Terisi</span>';
            cardBorder = 'hover:border-rose-400';
            // UPDATE TOMBOL INI:
            btnAction = `<button onclick="openDetailModal(${kamar.id}, '${kamar.nomor_kamar}')" class="btn btn-sm btn-outline w-full text-slate-600 hover:bg-slate-100 hover:text-slate-800">Detail Penyewa</button>`;
        } else {
            statusBadge = '<span class="badge badge-warning badge-sm gap-1 text-white"><i class="fas fa-tools"></i> Maintenance</span>';
            cardBorder = 'hover:border-orange-400';
            btnAction = `<button class="btn btn-sm btn-disabled w-full">Perbaikan</button>`;
        }

        const harga = formatRupiah(kamar.tipe_detail.harga_per_bulan);

        const cardHTML = `
            <div class="card bg-white shadow-sm border border-slate-100 p-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${cardBorder}">
                <div class="p-5 border-b border-slate-50 flex justify-between items-start">
                    <div>
                        <h3 class="font-display text-2xl font-bold text-slate-800">${kamar.nomor_kamar}</h3>
                        <p class="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">${kamar.tipe_detail.nama_tipe}</p>
                    </div>
                    ${statusBadge}
                </div>
                <div class="p-5 space-y-4">
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-slate-400"><i class="fas fa-layer-group w-5 text-center"></i> Lantai</span>
                        <span class="font-semibold text-slate-700">${kamar.lantai}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-slate-400"><i class="fas fa-tag w-5 text-center"></i> Harga</span>
                        <span class="font-bold text-indigo-600">${harga} <span class="text-xs text-slate-400 font-normal">/bulan</span></span>
                    </div>
                    
                    <div class="pt-2">
                        ${btnAction}
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });
}

// --- FILTER LOGIC (Client Side Biar Cepet) ---
window.filterKamar = (status) => {
    // Update Tab Active State
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('tab-active'));
    event.target.classList.add('tab-active');

    if (status === 'ALL') {
        renderKamar(allKamar);
    } else {
        const filtered = allKamar.filter(k => k.status === status);
        renderKamar(filtered);
    }
}

// Start 
const PAGE_MENU_IDS = { 'page-dashboard': 'menu-dashboard', 'page-kamar': 'menu-kamar', 'page-penyewa': 'menu-penyewa', 'page-keuangan': 'menu-keuangan' };

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    fetchPenyewa();
    fetchRiwayat();
    let last = 'page-dashboard';
    try { const s = localStorage.getItem('sultan_last_page'); if (s) last = s; } catch { }
    const menuId = PAGE_MENU_IDS[last] || 'menu-dashboard';
    const anchor = document.getElementById(menuId);
    switchPage(last, anchor);
    const s = document.getElementById('kamar-search');
    const st = document.getElementById('kamar-status');
    const pp = document.getElementById('kamar-perpage');
    const prev = document.getElementById('kamar-prev');
    const next = document.getElementById('kamar-next');
    if (s) s.addEventListener('input', () => { kamarTableState.search = s.value; kamarTableState.page = 1; renderKamarTable(); });
    if (st) st.addEventListener('change', () => { kamarTableState.status = st.value; kamarTableState.page = 1; renderKamarTable(); });
    if (pp) pp.addEventListener('change', () => { kamarTableState.perPage = parseInt(pp.value, 10); kamarTableState.page = 1; renderKamarTable(); });
    if (prev) prev.addEventListener('click', () => { if (kamarTableState.page > 1) { kamarTableState.page--; renderKamarTable(); } });
    if (next) next.addEventListener('click', () => { kamarTableState.page++; renderKamarTable(); });

    const ps = document.getElementById('penyewa-search');
    const ppp = document.getElementById('penyewa-perpage');
    const pprev = document.getElementById('penyewa-prev');
    const pnext = document.getElementById('penyewa-next');
    if (ps) ps.addEventListener('input', () => { penyewaTableState.search = ps.value; penyewaTableState.page = 1; renderPenyewaTable(); });
    if (ppp) ppp.addEventListener('change', () => { penyewaTableState.perPage = parseInt(ppp.value, 10); penyewaTableState.page = 1; renderPenyewaTable(); });
    if (pprev) pprev.addEventListener('click', () => { if (penyewaTableState.page > 1) { penyewaTableState.page--; renderPenyewaTable(); } });
    if (pnext) pnext.addEventListener('click', () => { penyewaTableState.page++; renderPenyewaTable(); });
});

// --- LOGIC MODAL & TRANSAKSI ---

// 1. Buka Modal Check-In
function openCheckInModal(kamarId, kamarNo) {
    openFormModal({
        title: `Check In: ${kamarNo}`,
        subtitle: 'Masukkan data penyewa baru',
        formId: 'form-checkin',
        submitText: 'Simpan & Check In',
        fields: [
            { type: 'text', id: 'nama_penyewa', label: 'Nama Lengkap', required: true, className: 'md:col-span-2' },
            { type: 'number', id: 'hp_penyewa', label: 'Nomor HP', required: true },
            { type: 'number', id: 'durasi_sewa', label: 'Durasi Sewa (Bulan)', value: 1, min: 1, required: true },
        ],
        onSubmit: (e) => submitCheckIn(e, kamarId)
    });
}

async function openAddKamarModal() {
    openModal('Tambah Kamar Baru', 'Isi detail kamar fisik', '<p class="text-center animate-pulse">Memuat tipe kamar...</p>');

    try {
        const res = await fetch(`${API_BASE}tipe-kamar/`, { headers: { 'Authorization': TOKEN_HEADER } });
        if (res.status === 401) { forceLogout(); return; }
        const tipeList = await res.json();

        const options = (tipeList.results || tipeList)
            .map(t => `<option value="${t.id}">${t.nama_tipe} - ${formatRupiah(t.harga_per_bulan)}</option>`)
            .join('');

        openFormModal({
            title: 'Tambah Kamar Baru',
            subtitle: 'Isi detail kamar fisik',
            formId: 'form-add-kamar',
            submitText: 'Simpan Kamar',
            fields: [
                { type: 'text', id: 'add_nomor_kamar', label: 'Nomor Kamar', placeholder: 'K001', required: true },
                { type: 'number', id: 'add_lantai', label: 'Lantai', value: 1, min: 1, required: true },
                { type: 'select', id: 'add_tipe', label: 'Tipe Kamar', required: true, className: 'md:col-span-2', options: [{ value: '', label: 'Pilih tipe kamar', selected: true }, ...((tipeList.results || tipeList).map(t => ({ value: t.id, label: `${t.nama_tipe} - ${formatRupiah(t.harga_per_bulan)}` })))] },
                {
                    type: 'select', id: 'add_status', label: 'Status', className: 'md:col-span-2', options: [
                        { value: 'KOSONG', label: 'KOSONG', selected: true },
                        { value: 'ISI', label: 'ISI' },
                        { value: 'MAINTENANCE', label: 'MAINTENANCE' }
                    ]
                },
            ],
            onSubmit: submitAddKamar
        });
    } catch (error) {
        showToastError('Gagal memuat tipe kamar');
    }
}

async function submitAddKamar(e) {
    e.preventDefault();
    const payload = {
        nomor_kamar: document.getElementById('add_nomor_kamar').value.trim(),
        lantai: parseInt(document.getElementById('add_lantai').value, 10),
        tipe: parseInt(document.getElementById('add_tipe').value, 10),
        status: document.getElementById('add_status').value
    };

    try {
        clearFieldError('add_nomor_kamar');
        if (!isValidNomorKamar(payload.nomor_kamar)) {
            showFieldError('add_nomor_kamar', 'Format nomor kamar tidak valid. Contoh: K001 atau A-01');
            return;
        }
        setSubmitting('form-add-kamar', true);
        const checkRes = await fetch(`${API_BASE}kamar/?search=${encodeURIComponent(payload.nomor_kamar)}`, { headers: { 'Authorization': TOKEN_HEADER } });
        if (checkRes.status === 401) { forceLogout(); return; }
        const checkData = await checkRes.json();
        const items = checkData.results || checkData;
        const exists = Array.isArray(items) && items.some(k => (k.nomor_kamar || '').toLowerCase() === payload.nomor_kamar.toLowerCase());
        if (exists) { showFieldError('add_nomor_kamar', 'Nomor kamar sudah ada'); return; }

        const res = await fetch(`${API_BASE}kamar/`, {
            method: 'POST',
            headers: { 'Authorization': TOKEN_HEADER, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.status === 401) { forceLogout(); return; }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Gagal menambah kamar');
        }
        document.getElementById('modal_detail').close();
        showToastSuccess('Kamar baru berhasil ditambahkan');
        fetchData();
    } catch (error) {
        showToastError(error.message);
    } finally {
        setSubmitting('form-add-kamar', false);
    }
}

// 2. Submit Check-In (POST ke API)
async function submitCheckIn(e, kamarId) {
    e.preventDefault();
    setSubmitting('form-checkin', true);

    const dataPenyewa = {
        nama_lengkap: document.getElementById('nama_penyewa').value,
        nomor_hp: document.getElementById('hp_penyewa').value,
        durasi_sewa_bulan: document.getElementById('durasi_sewa').value,
        kamar: kamarId // Relasi ke Kamar
    };

    try {
        const response = await fetch(`${API_BASE}penyewa/`, {
            method: 'POST',
            headers: {
                'Authorization': TOKEN_HEADER,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataPenyewa)
        });

        if (!response.ok) throw new Error('Gagal Check-In!');

        document.getElementById('modal_detail').close();
        showToastSuccess('Check-In Berhasil! Kamar otomatis terisi.');
        fetchData();

    } catch (error) {
        showToastError(error.message);
    } finally {
        setSubmitting('form-checkin', false);
    }
}

// 3. Buka Modal Detail (Check-Out)
async function openDetailModal(kamarId, kamarNo) {
    openModal(`Kamar ${kamarNo}`, 'Detail Penghuni Saat Ini', '<p class="text-center animate-pulse">Mengambil data...</p>');

    // Cari Siapa Penyewanya (Filter via API Penyewa)
    // Ingat di Serializer Kamar kita belum nampilin ID Penyewa, jadi kita cari manual
    // Cara cepat: Ambil dari endpoint Kamar lagi (karena data 'allKamar' kita udah punya info detail kalo kita update serializer, tapi biar gampang kita cari pake endpoint penyewa aja kalo perlu, ATAU pake data yang udah ada di frontend)

    // UPDATE LOGIC: Ambil dari 'allKamar' yang udah ada di memori browser
    const kamarData = allKamar.find(k => k.id === kamarId);

    // Tapi tunggu, Serializer Kamar kita di Phase 2 belum include 'penyewa_detail'.
    // JADI KITA FETCH DETAIL KAMAR DARI SERVER BIAR FRESH
    // Atau lebih gampang: Kita fetch daftar penyewa lalu cari yang kamarnya ID ini.

    try {
        // PERBAIKAN: Gunakan filter '?kamar=' bukan '?search='
        // Ini akan mencari penyewa yang secara spesifik menghuni ID kamar tersebut.
        const res = await fetch(`${API_BASE}penyewa/?kamar=${kamarId}`, {
            headers: { 'Authorization': TOKEN_HEADER }
        });

        const data = await res.json();

        // Karena filter ID kamar itu pasti cuma balikin 1 atau 0 data (karena OneToOne),
        // kita ambil data pertama aja.
        const penyewa = data.results[0];

        if (!penyewa) {
            document.getElementById('modal-content').innerHTML = `
                <div class="text-center py-4">
                    <p class="text-error font-bold">Data Penyewa Tidak Sinkron</p>
                    <p class="text-xs text-slate-400">Status kamar 'ISI' tapi data penyewa tidak ditemukan di database.</p>
                    <button onclick="document.getElementById('modal_detail').close()" class="btn btn-sm mt-2">Tutup</button>
                </div>`;
            document.querySelector('.modal-action').style.display = 'none';
            return;
        }

        // ... (Sisa kode rendering HTML modal di bawah ini SAMA SAJA, tidak perlu diubah) ...
        document.getElementById('modal-content').innerHTML = `
            <div class="text-center mb-6">
                <div class="avatar placeholder mb-2">
                    <div class="bg-indigo-100 text-indigo-600 rounded-full w-20 ring ring-offset-2 ring-indigo-50">
                        <span class="text-3xl font-bold">${penyewa.nama_lengkap.charAt(0)}</span>
                    </div>
                </div>
                <h3 class="font-bold text-xl text-slate-800">${penyewa.nama_lengkap}</h3>
                <p class="text-sm text-slate-500">${penyewa.nomor_hp}</p>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                    <span class="text-xs text-slate-400 block">Tanggal Masuk</span>
                    <span class="font-semibold">${penyewa.tanggal_masuk}</span>
                </div>
                <div>
                    <span class="text-xs text-slate-400 block">Durasi</span>
                    <span class="font-semibold">${penyewa.durasi_sewa_bulan} Bulan</span>
                </div>
            </div>
            
            <div class="divider">AKSI</div>
            
            <button onclick="submitCheckOut(${penyewa.id})" class="btn btn-error btn-outline w-full gap-2">
                <i class="fas fa-sign-out-alt"></i> CHECK OUT / HAPUS PENYEWA
            </button>
        `;

    } catch (err) {
        console.error(err);
        showToastError("Gagal mengambil detail penyewa.");
    }
}

// 4. Submit Check-Out (DELETE API)
async function submitCheckOut(penyewaId) {
    if (!confirm("Yakin ingin mengeluarkan penyewa ini? Data akan dihapus permanen.")) return;

    try {
        const response = await fetch(`${API_BASE}penyewa/${penyewaId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': TOKEN_HEADER
            }
        });

        if (!response.ok) throw new Error('Gagal Check-Out');

        document.getElementById('modal_detail').close();
        showToastSuccess('Check-Out Berhasil! Kamar sekarang kosong.');
        fetchData();

    } catch (error) {
        showToastError(error.message);
    }
}

function openFormModal({ title, subtitle, fields, onSubmit, formId = 'generic-form', submitText = 'Simpan' }) {
    const fieldHtml = (fields || []).map(f => {
        if (f.type === 'select') {
            const opts = (f.options || []).map(o => `<option value="${o.value}" ${o.selected ? 'selected' : ''}>${o.label}</option>`).join('');
            return `
                <div class="form-control ${f.className || ''}">
                    <label class="label"><span class="label-text">${f.label || ''}</span></label>
                    <select id="${f.id}" class="select select-bordered w-full" ${f.required ? 'required' : ''}>${opts}</select>
                </div>`;
        }
        return `
            <div class="form-control ${f.className || ''}">
                <label class="label"><span class="label-text">${f.label || ''}</span></label>
                <input type="${f.type || 'text'}" id="${f.id}" class="input input-bordered w-full" placeholder="${f.placeholder || ''}" value="${f.value || ''}" ${f.min != null ? `min="${f.min}"` : ''} ${f.required ? 'required' : ''} />
            </div>`;
    }).join('');

    const contentHtml = `
        <form id="${formId}">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${fieldHtml}
            </div>
            <div class="pt-4">
                <button type="submit" class="btn btn-primary bg-indigo-600 w-full">${submitText}</button>
            </div>
        </form>`;

    openModal(title, subtitle, contentHtml);
    const form = document.getElementById(formId);
    if (form) {
        (fields || []).forEach(f => {
            const el = document.getElementById(f.id);
            if (el) el.addEventListener('input', () => clearFieldError(f.id));
        });
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.addEventListener('click', (ev) => {
                ev.preventDefault();
                if (typeof form.requestSubmit === 'function') form.requestSubmit();
                else form.dispatchEvent(new Event('submit', { cancelable: true }));
            });
        }
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                setSubmitting(formId, true);
                if (typeof onSubmit === 'function') {
                    await onSubmit(e);
                } else if (typeof onSubmit === 'string' && typeof window[onSubmit] === 'function') {
                    await window[onSubmit](e);
                }
            } finally {
                setSubmitting(formId, false);
            }
        });
    }
}

function applyKamarFilters() {
    let rows = [...allKamar];
    const q = (kamarTableState.search || '').trim().toLowerCase();
    if (q) {
        rows = rows.filter(k =>
            (k.nomor_kamar || '').toLowerCase().includes(q) ||
            (k.tipe_detail?.nama_tipe || '').toLowerCase().includes(q) ||
            (k.status || '').toLowerCase().includes(q)
        );
    }
    if (kamarTableState.status !== 'ALL') {
        rows = rows.filter(k => (k.status || '') === kamarTableState.status);
    }
    return rows;
}

function renderKamarTable() {
    const body = document.getElementById('kamar-table-body');
    const info = document.getElementById('kamar-pagination-info');
    const pageBtn = document.getElementById('kamar-page');
    if (!body) return;
    const filtered = applyKamarFilters();
    const total = filtered.length;
    const per = kamarTableState.perPage;
    const totalPages = Math.max(1, Math.ceil(total / per));
    if (kamarTableState.page > totalPages) kamarTableState.page = totalPages;
    if (kamarTableState.page < 1) kamarTableState.page = 1;
    const start = (kamarTableState.page - 1) * per;
    const pageRows = filtered.slice(start, start + per);
    if (pageRows.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-6">Tidak ada data.</td></tr>';
    } else {
        body.innerHTML = pageRows.map(k => {
            const harga = formatRupiah(k.tipe_detail.harga_per_bulan);
            const statusBadge = k.status === 'KOSONG' ? '<span class="badge badge-success">Kosong</span>' : (k.status === 'ISI' ? '<span class="badge badge-error">Terisi</span>' : '<span class="badge badge-warning">Maintenance</span>');
            return `
                <tr>
                    <td class="font-semibold">${k.nomor_kamar}</td>
                    <td>${k.lantai}</td>
                    <td>${k.tipe_detail.nama_tipe}</td>
                    <td>${statusBadge}</td>
                    <td>${harga}</td>
                    <td class="text-right">
                        <button class="btn btn-xs" onclick="openEditKamarModal(${k.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-xs btn-error btn-outline" onclick="openDeleteKamarConfirm(${k.id}, '${k.nomor_kamar}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        }).join('');
    }
    if (info) info.innerText = total ? `Menampilkan ${start + 1}-${Math.min(start + per, total)} dari ${total} kamar` : 'Tidak ada data';
    if (pageBtn) pageBtn.innerText = `${kamarTableState.page}/${totalPages}`;
}

async function openEditKamarModal(kamarId) {
    const kamar = allKamar.find(k => k.id === kamarId);
    if (!kamar) return;
    openModal('Edit Kamar', 'Perbarui data kamar', '<p class="text-center animate-pulse">Memuat tipe kamar...</p>');
    try {
        const res = await fetch(`${API_BASE}tipe-kamar/`, { headers: { 'Authorization': TOKEN_HEADER } });
        if (res.status === 401) { forceLogout(); return; }
        const tipeList = await res.json();
        const opts = [{ value: '', label: 'Pilih tipe kamar' }, ...((tipeList.results || tipeList).map(t => ({ value: t.id, label: `${t.nama_tipe} - ${formatRupiah(t.harga_per_bulan)}`, selected: t.id === kamar.tipe_detail.id })))];
        openFormModal({
            title: 'Edit Kamar',
            subtitle: `Nomor ${kamar.nomor_kamar}`,
            formId: 'form-edit-kamar',
            submitText: 'Simpan Perubahan',
            fields: [
                { type: 'text', id: 'edit_nomor_kamar', label: 'Nomor Kamar', value: kamar.nomor_kamar, required: true },
                { type: 'number', id: 'edit_lantai', label: 'Lantai', value: kamar.lantai, min: 1, required: true },
                { type: 'select', id: 'edit_tipe', label: 'Tipe Kamar', required: true, className: 'md:col-span-2', options: opts },
                {
                    type: 'select', id: 'edit_status', label: 'Status', className: 'md:col-span-2', options: [
                        { value: 'KOSONG', label: 'KOSONG', selected: kamar.status === 'KOSONG' },
                        { value: 'ISI', label: 'ISI', selected: kamar.status === 'ISI' },
                        { value: 'MAINTENANCE', label: 'MAINTENANCE', selected: kamar.status === 'MAINTENANCE' }
                    ]
                },
            ],
            onSubmit: (e) => submitEditKamar(e, kamarId)
        });
    } catch (error) { showToastError('Gagal memuat tipe kamar'); }
}

async function submitEditKamar(e, kamarId) {
    e.preventDefault();
    const payload = {
        nomor_kamar: document.getElementById('edit_nomor_kamar').value.trim(),
        lantai: parseInt(document.getElementById('edit_lantai').value, 10),
        tipe: parseInt(document.getElementById('edit_tipe').value, 10),
        status: document.getElementById('edit_status').value
    };
    try {
        clearFieldError('edit_nomor_kamar');
        if (!isValidNomorKamar(payload.nomor_kamar)) { showFieldError('edit_nomor_kamar', 'Format nomor kamar tidak valid. Contoh: K001 atau A-01'); return; }
        setSubmitting('form-edit-kamar', true);
        const res = await fetch(`${API_BASE}kamar/${kamarId}/`, { method: 'PATCH', headers: { 'Authorization': TOKEN_HEADER, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.status === 401) { forceLogout(); return; }
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Gagal mengubah kamar'); }
        document.getElementById('modal_detail').close();
        showToastSuccess('Data kamar berhasil diperbarui');
        fetchData();
    } catch (error) { showToastError(error.message); }
    finally { setSubmitting('form-edit-kamar', false); }
}

function openDeleteKamarConfirm(kamarId, nomor) {
    openConfirmModal({
        title: 'Hapus Kamar',
        subtitle: `Nomor ${nomor}`,
        message: 'Tindakan ini tidak dapat dibatalkan.',
        confirmText: 'Hapus',
        cancelText: 'Batal',
        confirmClass: 'btn-error',
        onConfirm: () => submitDeleteKamar(kamarId)
    });
}

async function submitDeleteKamar(kamarId) {
    try {
        const res = await fetch(`${API_BASE}kamar/${kamarId}/`, { method: 'DELETE', headers: { 'Authorization': TOKEN_HEADER } });
        if (res.status === 401) { forceLogout(); return; }
        if (!res.ok) throw new Error('Gagal menghapus kamar');
        document.getElementById('modal_detail').close();
        showToastSuccess('Kamar berhasil dihapus');
        fetchData();
    } catch (error) { showToastError(error.message); }
}

function applyPenyewaFilters() {
    let rows = [...allPenyewa];
    const q = (penyewaTableState.search || '').trim().toLowerCase();
    if (q) {
        rows = rows.filter(p =>
            (p.nama_lengkap || '').toLowerCase().includes(q) ||
            (p.nomor_hp || '').toLowerCase().includes(q) ||
            (p.kamar_detail?.nomor_kamar || '').toLowerCase().includes(q)
        );
    }
    return rows;
}

function formatDateShort(d) {
    try { return new Date(d).toLocaleDateString('id-ID'); } catch { return d; }
}

function addMonthsISO(dateStr, months) {
    const d = new Date(dateStr);
    const r = new Date(d.getTime());
    r.setMonth(r.getMonth() + Number(months || 0));
    return r.toISOString();
}

function renderPenyewaTable() {
    const body = document.getElementById('penyewa-table-body');
    const info = document.getElementById('penyewa-pagination-info');
    const pageBtn = document.getElementById('penyewa-page');
    if (!body) return;
    const filtered = applyPenyewaFilters();
    const total = filtered.length;
    const per = penyewaTableState.perPage;
    const totalPages = Math.max(1, Math.ceil(total / per));
    if (penyewaTableState.page > totalPages) penyewaTableState.page = totalPages;
    if (penyewaTableState.page < 1) penyewaTableState.page = 1;
    const start = (penyewaTableState.page - 1) * per;
    const rows = filtered.slice(start, start + per);
    if (rows.length === 0) {
        body.innerHTML = '<tr><td colspan="7" class="text-center text-slate-400 py-6">Tidak ada penyewa.</td></tr>';
    } else {
        body.innerHTML = rows.map(p => {
            const masuk = formatDateShort(p.tanggal_masuk);
            const habis = formatDateShort(addMonthsISO(p.tanggal_masuk, p.durasi_sewa_bulan));
            return `
                <tr>
                    <td class="font-semibold">${p.nama_lengkap}</td>
                    <td>${p.nomor_hp}</td>
                    <td>${p.kamar_detail?.nomor_kamar || '-'}</td>
                    <td>${masuk}</td>
                    <td>${p.durasi_sewa_bulan} Bulan</td>
                    <td>${habis}</td>
                    <td class="text-right">
                        <button class="btn btn-xs" onclick="openEditPenyewaModal(${p.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-xs btn-success btn-outline" onclick="openPaymentModal(${p.id}, '${p.nama_lengkap}')" title="Input Pembayaran"><i class="fas fa-money-bill-wave"></i></button>
                        <button class="btn btn-xs" onclick="openExtendSewaModal(${p.id})"><i class="fas fa-calendar-plus"></i></button>
                        <button class="btn btn-xs btn-error btn-outline" onclick="openCheckOutConfirm(${p.id}, '${p.nama_lengkap}')"><i class="fas fa-sign-out-alt"></i></button>
                    </td>
                </tr>`;
        }).join('');
    }
    if (info) info.innerText = total ? `Menampilkan ${start + 1}-${Math.min(start + per, total)} dari ${total} penyewa` : 'Tidak ada data';
    if (pageBtn) pageBtn.innerText = `${penyewaTableState.page}/${totalPages}`;
}

function openCheckOutConfirm(penyewaId, nama) {
    openConfirmModal({ title: 'Check-Out Penyewa', subtitle: nama, message: 'Penyewa akan dihapus dan kamar dikosongkan.', confirmText: 'Check-Out', cancelText: 'Batal', confirmClass: 'btn-error', onConfirm: () => submitCheckOut(penyewaId) });
}

async function openEditPenyewaModal(pId) {
    const p = allPenyewa.find(x => x.id === pId);
    if (!p) return;
    openFormModal({
        title: 'Edit Penyewa', subtitle: p.nama_lengkap, formId: 'form-edit-penyewa', submitText: 'Simpan Perubahan', fields: [
            { type: 'text', id: 'edit_nama', label: 'Nama Lengkap', value: p.nama_lengkap, required: true },
            { type: 'number', id: 'edit_hp', label: 'Nomor HP', value: p.nomor_hp, required: true }
        ], onSubmit: (e) => submitEditPenyewa(e, pId)
    });
}

async function submitEditPenyewa(e, pId) {
    e.preventDefault();
    const payload = { nama_lengkap: document.getElementById('edit_nama').value.trim(), nomor_hp: document.getElementById('edit_hp').value.trim() };
    try {
        setSubmitting('form-edit-penyewa', true);
        const res = await fetch(`${API_BASE}penyewa/${pId}/`, { method: 'PATCH', headers: { 'Authorization': TOKEN_HEADER, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.status === 401) { forceLogout(); return; }
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Gagal mengubah penyewa'); }
        document.getElementById('modal_detail').close();
        showToastSuccess('Data penyewa diperbarui');
        fetchPenyewa();
        fetchData();
    } catch (error) { showToastError(error.message); }
    finally { setSubmitting('form-edit-penyewa', false); }
}

async function openExtendSewaModal(pId) {
    const p = allPenyewa.find(x => x.id === pId);
    if (!p) return;
    openFormModal({
        title: 'Perpanjang Sewa', subtitle: p.nama_lengkap, formId: 'form-extend-sewa', submitText: 'Simpan Durasi', fields: [
            { type: 'number', id: 'extend_durasi', label: 'Durasi Sewa (Bulan)', value: p.durasi_sewa_bulan, min: 1, required: true }
        ], onSubmit: (e) => submitExtendSewa(e, pId)
    });
}

async function submitExtendSewa(e, pId) {
    e.preventDefault();
    const payload = { durasi_sewa_bulan: parseInt(document.getElementById('extend_durasi').value, 10) };
    openModal('Edit Kamar', 'Perbarui data kamar', '<p class="text-center animate-pulse">Memuat tipe kamar...</p>');
    try {
        const res = await fetch(`${API_BASE}tipe-kamar/`, { headers: { 'Authorization': TOKEN_HEADER } });
        if (res.status === 401) { forceLogout(); return; }
        const tipeList = await res.json();
        const opts = [{ value: '', label: 'Pilih tipe kamar' }, ...((tipeList.results || tipeList).map(t => ({ value: t.id, label: `${t.nama_tipe} - ${formatRupiah(t.harga_per_bulan)}`, selected: t.id === kamar.tipe_detail.id })))];
        openFormModal({
            title: 'Edit Kamar',
            subtitle: `Nomor ${kamar.nomor_kamar}`,
            formId: 'form-edit-kamar',
            submitText: 'Simpan Perubahan',
            fields: [
                { type: 'text', id: 'edit_nomor_kamar', label: 'Nomor Kamar', value: kamar.nomor_kamar, required: true },
                { type: 'number', id: 'edit_lantai', label: 'Lantai', value: kamar.lantai, min: 1, required: true },
                { type: 'select', id: 'edit_tipe', label: 'Tipe Kamar', required: true, className: 'md:col-span-2', options: opts },
                {
                    type: 'select', id: 'edit_status', label: 'Status', className: 'md:col-span-2', options: [
                        { value: 'KOSONG', label: 'KOSONG', selected: kamar.status === 'KOSONG' },
                        { value: 'ISI', label: 'ISI', selected: kamar.status === 'ISI' },
                        { value: 'MAINTENANCE', label: 'MAINTENANCE', selected: kamar.status === 'MAINTENANCE' }
                    ]
                },
            ],
            onSubmit: (e) => submitEditKamar(e, kamarId)
        });
    } catch (error) { showToastError('Gagal memuat tipe kamar'); }
}

async function submitEditKamar(e, kamarId) {
    e.preventDefault();
    const payload = {
        nomor_kamar: document.getElementById('edit_nomor_kamar').value.trim(),
        lantai: parseInt(document.getElementById('edit_lantai').value, 10),
        tipe: parseInt(document.getElementById('edit_tipe').value, 10),
        status: document.getElementById('edit_status').value
    };
    try {
        clearFieldError('edit_nomor_kamar');
        if (!isValidNomorKamar(payload.nomor_kamar)) { showFieldError('edit_nomor_kamar', 'Format nomor kamar tidak valid. Contoh: K001 atau A-01'); return; }
        setSubmitting('form-edit-kamar', true);
        const res = await fetch(`${API_BASE}kamar/${kamarId}/`, { method: 'PATCH', headers: { 'Authorization': TOKEN_HEADER, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.status === 401) { forceLogout(); return; }
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Gagal mengubah kamar'); }
        document.getElementById('modal_detail').close();
        showToastSuccess('Data kamar berhasil diperbarui');
        fetchData();
    } catch (error) { showToastError(error.message); }
    finally { setSubmitting('form-edit-kamar', false); }
}

function openDeleteKamarConfirm(kamarId, nomor) {
    openConfirmModal({
        title: 'Hapus Kamar',
        subtitle: `Nomor ${nomor}`,
        message: 'Tindakan ini tidak dapat dibatalkan.',
        confirmText: 'Hapus',
        cancelText: 'Batal',
        confirmClass: 'btn-error',
        onConfirm: () => submitDeleteKamar(kamarId)
    });
}

async function submitDeleteKamar(kamarId) {
    try {
        const res = await fetch(`${API_BASE}kamar/${kamarId}/`, { method: 'DELETE', headers: { 'Authorization': TOKEN_HEADER } });
        if (res.status === 401) { forceLogout(); return; }
        if (!res.ok) throw new Error('Gagal menghapus kamar');
        document.getElementById('modal_detail').close();
        showToastSuccess('Kamar berhasil dihapus');
        fetchData();
    } catch (error) { showToastError(error.message); }
}

function applyPenyewaFilters() {
    let rows = [...allPenyewa];
    const q = (penyewaTableState.search || '').trim().toLowerCase();
    if (q) {
        rows = rows.filter(p =>
            (p.nama_lengkap || '').toLowerCase().includes(q) ||
            (p.nomor_hp || '').toLowerCase().includes(q) ||
            (p.kamar_detail?.nomor_kamar || '').toLowerCase().includes(q)
        );
    }
    return rows;
}

function formatDateShort(d) {
    try { return new Date(d).toLocaleDateString('id-ID'); } catch { return d; }
}

function addMonthsISO(dateStr, months) {
    const d = new Date(dateStr);
    const r = new Date(d.getTime());
    r.setMonth(r.getMonth() + Number(months || 0));
    return r.toISOString();
}

function renderPenyewaTable() {
    const body = document.getElementById('penyewa-table-body');
    const info = document.getElementById('penyewa-pagination-info');
    const pageBtn = document.getElementById('penyewa-page');
    if (!body) return;
    const filtered = applyPenyewaFilters();
    const total = filtered.length;
    const per = penyewaTableState.perPage;
    const totalPages = Math.max(1, Math.ceil(total / per));
    if (penyewaTableState.page > totalPages) penyewaTableState.page = totalPages;
    if (penyewaTableState.page < 1) penyewaTableState.page = 1;
    const start = (penyewaTableState.page - 1) * per;
    const rows = filtered.slice(start, start + per);
    if (rows.length === 0) {
        body.innerHTML = '<tr><td colspan="7" class="text-center text-slate-400 py-6">Tidak ada penyewa.</td></tr>';
    } else {
        body.innerHTML = rows.map(p => {
            const masuk = formatDateShort(p.tanggal_masuk);
            const habis = formatDateShort(addMonthsISO(p.tanggal_masuk, p.durasi_sewa_bulan));
            return `
                <tr>
                    <td class="font-semibold">${p.nama_lengkap}</td>
                    <td>${p.nomor_hp}</td>
                    <td>${p.kamar_detail?.nomor_kamar || '-'}</td>
                    <td>${masuk}</td>
                    <td>${p.durasi_sewa_bulan} Bulan</td>
                    <td>${habis}</td>
                    <td class="text-right">
                        <button class="btn btn-xs" onclick="openEditPenyewaModal(${p.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-xs" onclick="openExtendSewaModal(${p.id})"><i class="fas fa-calendar-plus"></i></button>
                        <button class="btn btn-xs btn-error btn-outline" onclick="openCheckOutConfirm(${p.id}, '${p.nama_lengkap}')"><i class="fas fa-sign-out-alt"></i></button>
                    </td>
                </tr>`;
        }).join('');
    }
    if (info) info.innerText = total ? `Menampilkan ${start + 1}-${Math.min(start + per, total)} dari ${total} penyewa` : 'Tidak ada data';
    if (pageBtn) pageBtn.innerText = `${penyewaTableState.page}/${totalPages}`;
}

function openCheckOutConfirm(penyewaId, nama) {
    openConfirmModal({ title: 'Check-Out Penyewa', subtitle: nama, message: 'Penyewa akan dihapus dan kamar dikosongkan.', confirmText: 'Check-Out', cancelText: 'Batal', confirmClass: 'btn-error', onConfirm: () => submitCheckOut(penyewaId) });
}

async function openEditPenyewaModal(pId) {
    const p = allPenyewa.find(x => x.id === pId);
    if (!p) return;
    openFormModal({
        title: 'Edit Penyewa', subtitle: p.nama_lengkap, formId: 'form-edit-penyewa', submitText: 'Simpan Perubahan', fields: [
            { type: 'text', id: 'edit_nama', label: 'Nama Lengkap', value: p.nama_lengkap, required: true },
            { type: 'number', id: 'edit_hp', label: 'Nomor HP', value: p.nomor_hp, required: true }
        ], onSubmit: (e) => submitEditPenyewa(e, pId)
    });
}

async function submitEditPenyewa(e, pId) {
    e.preventDefault();
    const payload = { nama_lengkap: document.getElementById('edit_nama').value.trim(), nomor_hp: document.getElementById('edit_hp').value.trim() };
    try {
        setSubmitting('form-edit-penyewa', true);
        const res = await fetch(`${API_BASE}penyewa/${pId}/`, { method: 'PATCH', headers: { 'Authorization': TOKEN_HEADER, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.status === 401) { forceLogout(); return; }
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Gagal mengubah penyewa'); }
        document.getElementById('modal_detail').close();
        showToastSuccess('Data penyewa diperbarui');
        fetchPenyewa();
        fetchData();
    } catch (error) { showToastError(error.message); }
    finally { setSubmitting('form-edit-penyewa', false); }
}

async function openExtendSewaModal(pId) {
    const p = allPenyewa.find(x => x.id === pId);
    if (!p) return;
    openFormModal({
        title: 'Perpanjang Sewa', subtitle: p.nama_lengkap, formId: 'form-extend-sewa', submitText: 'Simpan Durasi', fields: [
            { type: 'number', id: 'extend_durasi', label: 'Durasi Sewa (Bulan)', value: p.durasi_sewa_bulan, min: 1, required: true }
        ], onSubmit: (e) => submitExtendSewa(e, pId)
    });
}

async function submitExtendSewa(e, pId) {
    e.preventDefault();
    const payload = { durasi_sewa_bulan: parseInt(document.getElementById('extend_durasi').value, 10) };
    try {
        setSubmitting('form-extend-sewa', true);
        const res = await fetch(`${API_BASE}penyewa/${pId}/`, { method: 'PATCH', headers: { 'Authorization': TOKEN_HEADER, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.status === 401) { forceLogout(); return; }
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Gagal memperpanjang sewa'); }
        document.getElementById('modal_detail').close();
        showToastSuccess('Durasi sewa diperbarui');
        fetchPenyewa();
        fetchData();
    } catch (error) { showToastError(error.message); }
    finally { setSubmitting('form-extend-sewa', false); }
}

// --- LOGIC KEUANGAN ---

async function fetchRiwayat() {
    try {
        const response = await fetch(`${API_BASE}riwayat-bayar/`, { headers: { 'Authorization': TOKEN_HEADER } });
        if (response.status === 401) { forceLogout(); return; }
        if (!response.ok) throw new Error('Gagal ambil data keuangan.');
        const data = await response.json();
        allRiwayat = data.results || data;
        renderKeuangan();
    } catch (error) {
        console.error(error);
        // showToastError('Gagal memuat data keuangan');
    }
}

function renderKeuangan() {
    // 1. Hitung Total
    const total = allRiwayat.reduce((acc, curr) => acc + parseFloat(curr.jumlah), 0);

    // 2. Hitung Bulan Ini
    const now = new Date();
    const bulanIni = allRiwayat.filter(r => {
        const d = new Date(r.tanggal_bayar);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((acc, curr) => acc + parseFloat(curr.jumlah), 0);

    document.getElementById('keuangan-total').innerText = formatRupiah(total);
    document.getElementById('keuangan-bulan-ini').innerText = formatRupiah(bulanIni);

    // 3. Render Tabel Riwayat
    const list = document.getElementById('list-transaksi');
    if (allRiwayat.length === 0) {
        list.innerHTML = '<div class="text-center text-slate-400 py-8 text-sm">Belum ada data transaksi.</div>';
    } else {
        list.innerHTML = allRiwayat.slice(0, 10).map(r => `
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                    <p class="font-bold text-slate-700 text-sm">${r.keterangan || 'Pembayaran'}</p>
                    <p class="text-xs text-slate-400">${new Date(r.tanggal_bayar).toLocaleDateString('id-ID')}</p>
                </div>
                <span class="font-bold text-emerald-600 text-sm">+ ${formatRupiah(r.jumlah)}</span>
            </div>
        `).join('');
    }

    // 4. Render Chart
    renderChart();
}

function renderChart() {
    const ctx = document.getElementById('chartPendapatan');
    if (!ctx) return;

    // Group by Month (Last 6 Months)
    const labels = [];
    const data = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
        labels.push(monthName);

        const total = allRiwayat.filter(r => {
            const rd = new Date(r.tanggal_bayar);
            return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
        }).reduce((acc, curr) => acc + parseFloat(curr.jumlah), 0);

        data.push(total);
    }

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pendapatan (Rp)',
                data: data,
                backgroundColor: '#4f46e5',
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { display: false }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}
