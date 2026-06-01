using FluentAssertions;
using WinCraft.Application.Common.Interfaces;
using Xunit;

namespace WinCraft.UnitTests;

public class OptimizedBarTests
{
    [Fact]
    public void AddCut_DeductsLengthAndKerf()
    {
        var bar = new OptimizedBar(6000);
        bar.AddCut(1400, 3);
        bar.Remaining.Should().Be(6000 - 1400 - 3);
    }

    [Fact]
    public void IsRecoverable_WhenRemainingGte200()
    {
        var bar = new OptimizedBar(6000);
        bar.AddCut(5700, 3);
        bar.Remaining.Should().Be(297);
        bar.IsRecoverable.Should().BeTrue();
    }

    [Fact]
    public void IsRecoverable_WhenRemainingLt200_ReturnsFalse()
    {
        var bar = new OptimizedBar(6000);
        bar.AddCut(5850, 3);
        bar.Remaining.Should().Be(147);
        bar.IsRecoverable.Should().BeFalse();
    }
}

public class FfdBinPackingTests
{
    // Inline replication of FFD logic for unit-testability
    private static List<OptimizedBar> RunFfd(IEnumerable<int> lengths, int barLen = 6000, int kerf = 3)
    {
        var sorted = lengths.OrderByDescending(x => x).ToList();
        var bars   = new List<OptimizedBar>();
        foreach (var cut in sorted)
        {
            var bar = bars.FirstOrDefault(b => b.Remaining >= cut + kerf);
            if (bar != null) bar.AddCut(cut, kerf);
            else
            {
                var newBar = new OptimizedBar(barLen);
                newBar.AddCut(cut, kerf);
                bars.Add(newBar);
            }
        }
        return bars;
    }

    [Fact]
    public void FourEqualCuts_FitInOneBar()
    {
        // 4 × 1497mm + kerf = 4 × 1500 = 6000 → fits in 1 bar
        var bars = RunFfd([1497, 1497, 1497, 1497]);
        bars.Should().HaveCount(1);
        bars[0].Cuts.Should().HaveCount(4);
    }

    [Fact]
    public void LargeCut_RequiresOwnBar()
    {
        var bars = RunFfd([5999]);
        bars.Should().HaveCount(1);
        bars[0].Remaining.Should().Be(1);
    }

    [Fact]
    public void MultipleSmallCuts_PackedEfficiently()
    {
        // 12 × 499mm + kerf=3 → each takes 502mm, 6000/502 ≈ 11 per bar
        var cuts = Enumerable.Repeat(499, 12).ToList();
        var bars = RunFfd(cuts);
        bars.Count.Should().BeLessThanOrEqualTo(2);
    }

    [Fact]
    public void EmptyInput_ReturnsNoBars()
    {
        var bars = RunFfd([]);
        bars.Should().BeEmpty();
    }

    [Fact]
    public void RecoverableAndScrapAreCorrectlyClassified()
    {
        // One bar with 300mm remaining → recoverable
        // One bar with 100mm remaining → scrap
        var bars = RunFfd([5697, 5897]);  // 6000-5697-3=300, 6000-5897-3=100
        bars.Should().HaveCount(2);
        bars.Count(b => b.IsRecoverable).Should().Be(1);  // 300 >= 200
        bars.Count(b => !b.IsRecoverable && b.Remaining > 0).Should().Be(1);  // 100 < 200
    }
}
