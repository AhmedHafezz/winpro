using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WinCraft.Application.Common.Interfaces;
using WinCraft.Shared.Helpers;

namespace WinCraft.Infrastructure.Services;

public class PdfService(IApplicationDbContext db) : IPdfService
{
    public async Task<byte[]> GenerateQuotationPdfAsync(Guid quotationId, CancellationToken ct = default)
    {
        var q = await db.Quotations
            .Include(x => x.Customer)
            .Include(x => x.Designs).ThenInclude(d => d.GlassType)
            .Include(x => x.Designs).ThenInclude(d => d.Series)
            .FirstOrDefaultAsync(x => x.Id == quotationId, ct)
            ?? throw new KeyNotFoundException("عرض السعر غير موجود");

        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontFamily("Arial"));

                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("WinCraft ERP").FontSize(18).Bold().FontColor("#1e4db7");
                        col.Item().Text($"هاتف: ").FontSize(9);
                    });
                });

                page.Content().Column(col =>
                {
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(cd =>
                        {
                            cd.RelativeColumn(); cd.RelativeColumn();
                            cd.RelativeColumn(); cd.RelativeColumn();
                        });
                        t.Cell().Background("#f8fafc").Padding(5).Text($"رقم العرض\n{q.Code}").FontSize(9);
                        t.Cell().Background("#f8fafc").Padding(5).Text($"التاريخ\n{q.Date:dd/MM/yyyy}").FontSize(9);
                        t.Cell().Background("#f8fafc").Padding(5).Text($"صالح حتى\n{q.ValidUntil:dd/MM/yyyy}").FontSize(9);
                        t.Cell().Background("#f8fafc").Padding(5).Text($"العميل\n{q.Customer.Name}").FontSize(9);
                    });

                    col.Item().PaddingVertical(8).LineHorizontal(1).LineColor("#e2e8f0");

                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(cd =>
                        {
                            cd.ConstantColumn(30);
                            cd.RelativeColumn(2.5f);
                            cd.RelativeColumn();
                            cd.RelativeColumn();
                            cd.RelativeColumn();
                            cd.ConstantColumn(35);
                            cd.RelativeColumn();
                            cd.RelativeColumn();
                        });

                        string[] headers = { "#", "الوصف", "الموقع", "الأبعاد", "الزجاج", "كمية", "سعر/وحدة", "الإجمالي" };
                        foreach (var h in headers)
                            t.Cell().Background("#1e4db7").Padding(5)
                                .Text(h).FontColor("#fff").FontSize(9).Bold();

                        for (int i = 0; i < q.Designs.Count; i++)
                        {
                            var d = q.Designs.ElementAt(i);
                            var bg = i % 2 == 0 ? "#fff" : "#f8fafc";
                            t.Cell().Background(bg).Padding(4).Text($"{i + 1}").FontSize(9);
                            t.Cell().Background(bg).Padding(4).Column(co =>
                            {
                                co.Item().Text(d.Code).FontSize(10).Bold();
                                co.Item().Text(d.Series?.Code ?? "").FontSize(8).FontColor("#64748b");
                            });
                            t.Cell().Background(bg).Padding(4).Text(d.Location ?? "").FontSize(9);
                            t.Cell().Background(bg).Padding(4).Text($"{d.Width}×{d.Height}mm").FontSize(9);
                            t.Cell().Background(bg).Padding(4).Text(d.GlassType?.Code ?? "").FontSize(8);
                            t.Cell().Background(bg).Padding(4).Text($"{d.Qty}").FontSize(9);
                            t.Cell().Background(bg).Padding(4).Text("—").FontSize(9);
                            t.Cell().Background(bg).Padding(4).Text("—").FontSize(9).Bold();
                        }
                    });

                    var subtotal = q.TotalValue;
                    var discAmt  = Kwd.ApplyDiscount(subtotal, q.DiscountPct);
                    var taxAmt   = Kwd.Tax(discAmt, q.TaxPct / 100);
                    var grand    = Kwd.GrandTotal(subtotal, q.DiscountPct, q.TaxPct / 100);

                    col.Item().PaddingTop(10).AlignRight().Width(220).Table(t =>
                    {
                        t.ColumnsDefinition(cd => { cd.RelativeColumn(); cd.RelativeColumn(); });
                        t.Cell().PaddingVertical(3).Text("المجموع الفرعي").FontSize(10);
                        t.Cell().PaddingVertical(3).Text(Kwd.Format(subtotal)).FontSize(10);
                        t.Cell().PaddingVertical(3).Text($"خصم {q.DiscountPct}%").FontSize(10);
                        t.Cell().PaddingVertical(3).Text($"-{Kwd.Format(subtotal - discAmt)}").FontSize(10).FontColor("#ef4444");
                        t.Cell().PaddingVertical(3).Text($"ضريبة {q.TaxPct}%").FontSize(10);
                        t.Cell().PaddingVertical(3).Text(Kwd.Format(taxAmt)).FontSize(10);
                        t.Cell().PaddingVertical(3).Text("الإجمالي النهائي").FontSize(10);
                        t.Cell().PaddingVertical(3).Text(Kwd.Format(grand)).FontSize(10).Bold().FontColor("#1e4db7");
                    });
                });

                page.Footer().Row(row =>
                {
                    row.RelativeItem().Text(t =>
                    {
                        t.Span("WinCraft ERP  |  ").FontColor("#94a3b8").FontSize(8);
                        t.CurrentPageNumber().FontSize(8);
                        t.Span(" / ").FontSize(8);
                        t.TotalPages().FontSize(8);
                    });
                    row.ConstantItem(150).AlignRight()
                        .Text($"تاريخ الطباعة: {DateTime.Now:dd/MM/yyyy}").FontSize(8).FontColor("#94a3b8");
                });
            });
        });

        return document.GeneratePdf();
    }

    public Task<byte[]> GenerateCuttingListPdfAsync(Guid workOrderId, CancellationToken ct = default)
        => Task.FromResult(Array.Empty<byte>());

    public Task<byte[]> GenerateBomPdfAsync(Guid bomId, CancellationToken ct = default)
        => Task.FromResult(Array.Empty<byte>());
}
