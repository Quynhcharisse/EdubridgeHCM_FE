export function buildVietQrImageUrl(bankInfo, options = {}) {
    const template =
        typeof options === "string" ? options : String(options?.template ?? "compact2");
    const amount = typeof options === "object" && options != null ? options.amount : undefined;

    const bankId = String(bankInfo?.bankId ?? "").trim();
    const accountNo = String(bankInfo?.accountNo ?? "").trim();
    if (!bankId || !accountNo) return "";
    const params = new URLSearchParams();
    const accountName = String(bankInfo?.accountName ?? "").trim();
    if (accountName) params.set("accountName", accountName);
    const fee = Number(amount);
    if (Number.isFinite(fee) && fee > 0) params.set("amount", String(Math.trunc(fee)));
    const base = `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(accountNo)}-${template}.png`;
    const query = params.toString();
    return query ? `${base}?${query}` : base;
}

export function pickBankInfoData(raw) {
    if (!raw || typeof raw !== "object") return null;
    const bank = raw.bankInfoData ?? raw.bank_info ?? raw.bankInfo ?? raw;
    if (!bank || typeof bank !== "object") return null;
    const bankId = String(bank.bankId ?? "").trim();
    const accountNo = String(bank.accountNo ?? "").trim();
    if (!bankId || !accountNo) return null;
    return {
        bankId,
        accountNo,
        accountName: String(bank.accountName ?? "").trim(),
        bankName: String(bank.bankName ?? "").trim(),
    };
}
