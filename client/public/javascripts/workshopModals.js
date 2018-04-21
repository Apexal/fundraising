$('.workshop-modal').on('shown.bs.modal', function() {
  const workshopId = $(this).data('workshop-id');
  $.getJSON('/api/workshops/' + workshopId, (data, err) => {
    $(this)
      .find('.funds-total')
      .text(`$${data.fundraising.total} total`);
  });
});
