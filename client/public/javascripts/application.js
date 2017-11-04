$(function () {
    const regionSelect = $('#region-select');
    const rankSelect = $('#rank');
    const rankLabel = $('label[for="superior"]');
    const directorsSelect = $('#directors');
    const ambassadorsSelect = $('#ambassadors');

    regionSelect.on('change', function() {
        const regionId = this.value;
        if (regionId == "none") {
            $('#after-region').hide();
        } else {
            $('#after-region').show();
        }

        // Un-select both
        directorsSelect.val([]);
        ambassadorsSelect.val([]);

        // Filter selects based on data-region matching value of region select
        directorsSelect.find("option[data-region='" + regionId + "']").show();
        directorsSelect.find("option:not([data-region='" + regionId + "'])").hide();

        ambassadorsSelect.find("option[data-region='" + regionId + "']").show();
        ambassadorsSelect.find("option:not([data-region='" + regionId + "'])").hide();
    });


    rankSelect.on('change', function () {
        if (this.value == 'teacher') {
            rankLabel.show();
            rankLabel.text('Program Director');
            directorsSelect.show();
            ambassadorsSelect.hide();
        } else if (this.value == 'director') {
            rankLabel.show();
            rankLabel.text('Ambassador');
            directorsSelect.hide();
            ambassadorsSelect.show();
        }
    });
});